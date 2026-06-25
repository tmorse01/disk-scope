#![cfg(target_os = "windows")]

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::os::windows::ffi::OsStrExt;
use std::path::{Path, PathBuf};
use windows::core::PCWSTR;
use windows::Win32::Foundation::FILETIME;
use windows::Win32::Storage::FileSystem::{
  FindClose, FindExInfoBasic, FindExSearchNameMatch, FindFirstFileExW, FindNextFileW,
  FIND_FIRST_EX_LARGE_FETCH, WIN32_FIND_DATAW,
};

const FILE_ATTRIBUTE_DIRECTORY: u32 = 0x10;
const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;

fn to_wide(value: &str) -> Vec<u16> {
  Path::new(value)
    .as_os_str()
    .encode_wide()
    .chain(std::iter::once(0))
    .collect()
}

fn widestring_to_string(buffer: &[u16]) -> String {
  let end = buffer.iter().position(|&ch| ch == 0).unwrap_or(buffer.len());
  String::from_utf16_lossy(&buffer[..end])
}

fn filetime_to_ms(ft: &FILETIME) -> f64 {
  let high = ft.dwHighDateTime as u64;
  let low = ft.dwLowDateTime as u64;
  let ticks = (high << 32) | low;
  const WINDOWS_UNIX_EPOCH_DIFF_100NS: u64 = 11_644_473_600_000_000;
  let unix_100ns = ticks.saturating_sub(WINDOWS_UNIX_EPOCH_DIFF_100NS);
  (unix_100ns / 10_000) as f64
}

fn join_path(dir_path: &str, name: &str) -> String {
  let mut joined = PathBuf::from(dir_path);
  joined.push(name);
  joined.to_string_lossy().into_owned()
}

#[napi(object)]
pub struct NativeDirectoryEntry {
  pub name: String,
  pub path: String,
  #[napi(js_name = "isDirectory")]
  pub is_directory: bool,
  #[napi(js_name = "isSymlink")]
  pub is_symlink: bool,
  #[napi(js_name = "sizeBytes")]
  pub size_bytes: i64,
  #[napi(js_name = "mtimeMs")]
  pub mtime_ms: Option<f64>,
}

#[napi]
pub fn read_directory(dir_path: String) -> Result<Vec<NativeDirectoryEntry>> {
  let mut pattern = dir_path.clone();
  if !pattern.ends_with('\\') && !pattern.ends_with('/') {
    pattern.push('\\');
  }
  pattern.push('*');

  let pattern_wide = to_wide(&pattern);
  let mut find_data = WIN32_FIND_DATAW::default();

  unsafe {
    let handle = FindFirstFileExW(
      PCWSTR(pattern_wide.as_ptr()),
      FindExInfoBasic,
      &mut find_data as *mut _ as *mut core::ffi::c_void,
      FindExSearchNameMatch,
      None,
      FIND_FIRST_EX_LARGE_FETCH,
    )
    .map_err(|error| Error::from_reason(format!("FindFirstFileExW failed: {error}")))?;

    if handle.is_invalid() {
      return Err(Error::from_reason("FindFirstFileExW returned an invalid handle"));
    }

    let mut results = Vec::new();

    loop {
      let name = widestring_to_string(&find_data.cFileName);
      if name != "." && name != ".." {
        let attrs = find_data.dwFileAttributes;
        let is_reparse = (attrs & FILE_ATTRIBUTE_REPARSE_POINT) != 0;
        let is_dir = (attrs & FILE_ATTRIBUTE_DIRECTORY) != 0;
        let size_bytes = if is_dir || is_reparse {
          0i64
        } else {
          ((find_data.nFileSizeHigh as u64) << 32 | find_data.nFileSizeLow as u64) as i64
        };

        results.push(NativeDirectoryEntry {
          name: name.clone(),
          path: join_path(&dir_path, &name),
          is_directory: is_dir && !is_reparse,
          is_symlink: is_reparse,
          size_bytes,
          mtime_ms: Some(filetime_to_ms(&find_data.ftLastWriteTime)),
        });
      }

      if FindNextFileW(handle, &mut find_data).is_err() {
        break;
      }
    }

    let _ = FindClose(handle);
    Ok(results)
  }
}
