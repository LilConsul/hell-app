import {clsx} from "clsx";
import {twMerge} from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const apiRequest = async (url, options = {}) => {
  const { headers: customHeaders = {}, signal, ...rest } = options;
  const response = await fetch(url, {
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...customHeaders,
    },
    ...rest,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API request failed: ${url}`, errorData);
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};
