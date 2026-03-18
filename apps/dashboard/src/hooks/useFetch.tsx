import { useEffect, useRef, useState } from "react";

const useFetch = (endpoint: string, options?: RequestInit) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    useEffect(() => {
        setLoading(true);
        fetch(`${BASE_URL}${endpoint}`, optionsRef.current)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [endpoint, BASE_URL]);

    return { data, error, loading };
};

export default useFetch;