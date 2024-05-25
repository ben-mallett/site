import React, { ReactNode } from 'react';

type ContainerProps = {
    children: ReactNode; 
    className?: string;
};

const Container: React.FC<ContainerProps> = ({ children, className }) => {
    return (
        <div className="w-full flex justify-center items-start">
            <div className={`bg-black w-4/5 ${className}`}>
                {children}
            </div>
        </div>
    );
};

export default Container;