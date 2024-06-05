"use client"

import { Header } from '@/components/Header';
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function ContactPage() {
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        message: ''
    });

    const validateEmail = (email: string) => {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData({
        ...formData,
        [name]: value
        });

        setErrors({
        ...errors,
        [name]: ''
        });
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        let valid = true;
        let newErrors = { name: '', email: '', message: '' };

        if (formData.name.trim() === '') {
            newErrors.name = 'Name is required';
            valid = false;
        }

        if (!validateEmail(formData.email)) {
            newErrors.email = 'Email is invalid';
            valid = false;
        } else if (formData.email.trim() === '') {
            newErrors.email = 'Email is required';
            valid = false;
        }

        if (formData.message.trim() === '') {
            newErrors.message = 'Message is required';
            valid = false;
        }

        setErrors(newErrors);

        if (valid) {
            toast({
                title: "Message Sent",
                description: "I'll get back to you as soon as I can"
            })
            setFormData({
                name: '',
                email: '',
                message: ''
            });
        }
    };

    return (
        <main>
            <Header/>
            <div className='w-full h-full pt-20 flex flex-col justify-center items-center px-2'>
                <h2 className="">So you want my number...</h2>
                <p className="px-10 py-5">Write your name, email, and a quick message below and I will get back to you.</p>
                <form onSubmit={handleSubmit} className="flex flex-col justify-start items-center w-full sm:w-[600px] bg-purple-400 p-10 border border-black border-2">
                    <div className="flex flex-col justify-start items-start w-full px-5 h-1/5">
                        <label>
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full h-10 px-4 border border-black border-2"
                        />
                        {
                            errors.name && 
                            <span className="error">{errors.name}</span>
                        }
                    </div>
                    <div className="flex flex-col justify-start items-start w-full p-5 h-1/5 focus:scale-115">
                        <label>
                            Email
                        </label>
                        <input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full h-10 px-4 border border-black border-2 focus:scale-115"
                        />
                        {
                            errors.email && 
                            <span className="error">{errors.email}</span>
                        }
                    </div>
                    <div className="flex flex-col justify-start items-start w-full p-5 h-2/5">
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            className="w-full h-20 px-4 border border-black border-2 focus:scale-115"
                        />
                        {
                            errors.message && 
                            <span className="error">{errors.message}</span>
                        }
                    </div>
                    <button 
                        type="submit"
                        className='flex p-2 hover-shadow-lg bg-emerald-400 border border-2 border-black w-1/2 justify-center items-center'
                    >
                        Submit
                    </button>
                </form>
            </div>
        </main>
    );
};
