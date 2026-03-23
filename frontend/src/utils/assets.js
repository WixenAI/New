import { API_BASE_URL } from "../api/client";

export function resolveAssetUrl(value) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${API_BASE_URL}${value}`;
}
