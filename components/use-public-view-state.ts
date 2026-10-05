"use client";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
// Only non-sensitive public browsing preferences; never store credentials or forms here.
const values = new Map<string, unknown>();
export function usePublicViewState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
 const [value, setValue] = useState<T>(() => values.has(key) ? values.get(key) as T : initial);
 useEffect(() => { values.delete(key); values.set(key, value); if (values.size > 64) values.delete(values.keys().next().value!); }, [key, value]);
 return [value, setValue];
}
