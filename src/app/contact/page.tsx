"use client"

import { PageShell } from '@/components/PageShell';
import { Body, Button, CellReveal, Display, Field, Input, Panel, Slop, Textarea } from '@/components/theme';
import React, { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { WindowConway } from '@/components/Conway';
import emailjs from '@emailjs/browser';


export default function ContactPage() {
    const form = useRef<React.LegacyRef<HTMLInputElement>>();
    const { toast } = useToast()
    const [sending, setSending] = useState(false);
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
            setSending(true);
            emailjs
            .sendForm(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID as string, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID as string, form.current as any, {
                publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY as string,
              })
            .then(
                () => {
                    toast({
                        title: "Message Sent",
                        description: "I'll get back to you as soon as I can"
                    })
                    setFormData({
                        name: '',
                        email: '',
                        message: ''
                    });
                },
                (error: any) => {
                    toast({
                        title: "Uh oh...",
                        description: "Looks like I didn't get your message. Try again some other time."
                    })
                    console.log('FAILED...', error);
                },
            )
            .finally(() => setSending(false));
        }
    };

    return (
        <PageShell
            backdrop={<div className="h-full w-full opacity-20"><WindowConway settings={false}/></div>}
            className="flex flex-col items-center justify-center gap-8"
        >
            <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
                <Display as="h1" size="lg">
                    <Slop face="wide">So you </Slop>
                    <Slop face="serif">want </Slop>
                    <Slop face="condensed">my </Slop>
                    <Slop face="outline">num</Slop>
                    <Slop face="pixel">ber...</Slop>
                </Display>
                <Body>Write your name, email, and a quick message below and I will get back to you.</Body>
            </div>
            <CellReveal order="rows" spread={700} className="w-full max-w-xl">
            <Panel accent brackets className="w-full bg-m-surface/90 backdrop-blur" bodyClassName="p-5 md:p-8">
                <form ref={form as any} onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <Field label="Name" htmlFor="name" error={errors.name}>
                        <Input id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
                    </Field>
                    <Field label="Email" htmlFor="email" error={errors.email}>
                        <Input id="email" type="text" name="email" value={formData.email} onChange={handleChange} />
                    </Field>
                    <Field label="Message" htmlFor="message" error={errors.message}>
                        <Textarea id="message" name="message" value={formData.message} onChange={handleChange} />
                    </Field>
                    <Button type="submit" size="lg" className="self-start">
                        {sending ? "Sending" : "Contact me"}
                    </Button>
                </form>
            </Panel>
            </CellReveal>
        </PageShell>
    );
};
