import { useState, useEffect } from "react";

const useWindowDimensions = () => {
    const [width, setWidth] = useState<number>(0); 
    const [height, setHeight] = useState<number>(0);

    
    /**
     * Adds an event listener to the window for resizing and updates state accordingly
    */
   useEffect(() => {
        /**
         * On window resize sets width and height to size of window's inner dimensions
         */
        const updateDimensions = () => {
            setWidth(window.innerWidth);
            setHeight(window.innerHeight);
        }

        if (typeof window !== 'undefined') {
            updateDimensions()
        }
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    return {
        width,
        height
    };
};

export default useWindowDimensions;