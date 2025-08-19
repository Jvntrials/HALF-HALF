
import { useState, useEffect } from 'react';

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const output = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key as keyof T];
            const targetValue = target[key as keyof T];

            if (isObject(targetValue) && isObject(sourceValue)) {
                output[key as keyof T] = deepMerge(targetValue, sourceValue as object) as any;
            } else if(Array.isArray(targetValue) && Array.isArray(sourceValue)) {
                // For this app's purpose, we assume arrays are merged by concatenation.
                // A more complex merge might check for unique items.
                output[key as keyof T] = [...targetValue, ...sourceValue] as any;
            } else {
                output[key as keyof T] = sourceValue;
            }
        }
    }
    return output;
}

function isObject(item: any): item is object {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsedItem = JSON.parse(item);
                // Simple merge to ensure new properties in initialValue are respected
                if (isObject(initialValue) && isObject(parsedItem)) {
                    return { ...initialValue, ...parsedItem };
                }
                return parsedItem;
            }
            return initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}
