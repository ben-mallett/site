"use client"

import { Header } from '@/components/Header';
import React, { useEffect, useRef } from 'react';


export default function ReefVideoStream() {
    const videoRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.src = `http://192.168.1.250:19991/stream`;
        }
    }, [videoRef]);

    useEffect(() => {
        if (videoRef.current) {
            const videoURL = `http://192.168.1.250:19991/stream`;
            videoRef.current.src = videoURL;

            console.log('Video URL:', videoURL);

            videoRef.current.onload = () => {
                console.log('Video stream loaded successfully');
            };

            videoRef.current.onerror = (error) => {
                console.error('Error loading video stream:', error);
            };
        }
    }, [videoRef]);

    return (
        <main>
            <div className="z-40 w-full h-full">
                <div>
                    <Header/>   
                </div>
                <div className="flex justify-center items-center">
                    <div className='w-[200px] sm:w-[400px] lg:w-[800px] h-[150px] sm:h-[300px] lg:h-[600px] flex flex-col justify-center items-center z-10 relative border border-2 border-black mt-20'>
                        <img ref={videoRef} alt="Video stream from reef tank" />
                    </div>
                </div>
            </div>
        </main>
    );
};
