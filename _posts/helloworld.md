---
title: Hello World!
description: "A short introduction about who I am and what this site is all about."
authors: [Ben]
date: 'June 5, 2024'
slug: 'helloworld'
tags: ['Bio']
keywords: ['Computer Science', 'Software Engineer', 'Biography', 'About Me']
language: 'English'
---

Hey! If you're reading this you have some interest in who I am or what this site is all about. By the end of this article, I hope to give you a complete picture of both. Let's get started with the former.  

### Early Studies + Undergrad 
First, an introduction. My name is Ben and I'm a Software Engineer.

My first introduction to Computer Science was in high school, where in AP CS I got a crash course in the basics of computer science for use in mathematics and coding problems. I enjoyed this course and the methods of computational thinking that I learned here enough to make the decision to major in CS.

I studied at Northeastern University for undergrad where I learned about classical computer science and systems. During undergrad I built a strong foundation of software engineering and computer science skills. 

Throughout my courses I built a large portion of a modern computing stack and gained a strong understanding of crucial concepts:  

- In Computer Organization, I built an 8-bit processor and all supporting circuits capable of running MIPS assembly programs giving me a strong understanding of exactly how computers work and how bits flow through the wire. 
- In Computer Systems, I built a shell supporting a subset of bash instructions and read the entire source for Unix, informing my knowledge of how operating systems and OS level operations work. 
- In Computer Networks, I built a TCP/IP frame encoding/decoding stack which I used in a custom distributed DNS and CDN service that I built and deployed globally, giving me experience in both distributed systems and efficient computer networking. 
- In Programming Languages, I built a simple functional programming language, teaching me a ton about lexing, parsing, and evaluation semantics.
- In Graph Systems and Analytics, I went deep into graph-based architectures, experimenting with Spark/Map-Reduce and enhancing a unique graph mining algorithm (UNOT).
- Through Mathematics of Data Models and Linear Algebra, I gained a strong understanding of the mathematics behind machine learning techniques.

Co-op is a big portion of the educational experience at Northeastern, for me doubly so. During my sophomore year at Northeastern I started applying for my first co-op. I ended up securing a Software Engineering Co-op position at Running Tide, a post Series-B, nature-based carbon removal startup. This opportunity proved fruitful, not only did I work here for the duration of my 6 month co-op, but also through the remainder of my undergrad and graduate programs. 

### Graduate Studies

During my undergraduate degree at Northeastern, I took graduate courses to gain progress on a Master's Degree. Through the course of my graduate program I completed several end-to-end software projects, learned core software engineering best practices, practiced cutting edge machine learning and computer vision techniques, and overall rounded out my software engineering skillset. Specifically, I completed several polished software projects.

- In Web Development, I created a Secret Santa application that allowed users to join gift giving groups, wishlist items, give gifts, and showcase their generosity. I leveraged TypeScript, MongoDB, React, and NextJS to create and host this application while leverage best practices for testing and CI/CD.
- In Software Engineering, I collaborated on a team to create a networked drawing application using D, a C-like language that provides guarantees around memory safety. In addition to simply learning this language, we developed an application with near complete testing coverage, a comprehensive GitHub Actions based CI/CD pipeline, and efficient socket based networking. With this project, I also had the unique opportunity to present on my experience learning D at DConf '23 in London.
- In Machine Learning, I implemented a data pipeline and Convolutional Neural Network (CNN) model for retina disease detection. Using k-fold cross validation our model acheived a solid 97% accuracy.
- In Computer Networks, I implemented a web crawler from scratch, implementing session capabilities and circular URL detection. 
- In Data Mining and Large Scale Processing, I implemented a gunshot detection model using a CNN. By converting audio files into their Mel Spectrogram, we gained insights into the power and cadence of gunshots in the form of spatial data, which lent itself well to the convolutional model.

Throughout my graduate degree, experiential learning proved to be incredibly powerful. I gained hands on experience building professional-grade projects in a collaborative environment.

### Early Employment

Earlier, I mentioned my co-op position at Running Tide. This position stayed with me long after my co-op completion. From my sophomore year in early 2022 to June 2024, I worked full-time at Running Tide. 

Running Tide was a nature-based carbon removal company. What does that mean? At Running Tide, we leveraged the ocean to store carbon at geologic scales. In practice, this means that we deployed biomass into the deep ocean where it can grow macroalgae (Sidenote: At Running Tide we showed that yes, you actually can grow macroalgae far offshore, we have the photos to prove it). Eventually, that substrate becomes negatively buoyant and sinks below 1,000 meters, where it is stored durably at geologic timescales. 

Due to the nature of our interventions (being far offshore and all), it is critical to physically verify their efficacy. At Running Tide I developed portions of this verification system. Specifically, I've worked on writing firmware for our offshore buoys, developed web software for fleet management and data reception, implemented ML data pipelines for machine vision systems, created hardware systems to simulate offshore data, and much more. 

#### Offshore Verification Buoys
To verify our interventions, we maintained a high-tech fleet of buoys, ranging from small trajectory buoys to large camera and machine vision buoys. I worked on the software and firmware stack for many of these buoys, including our accelerometer buoy, cage buoys, and cam-lite buoys. I wrote ZephyrRTOS drivers to control various hardware (temperature sensors, cameras, fluorometers, etc). I wrote Cron-based jobs that collect, compress, serialize, and transmit various sensor readings and testing information. I wrote portions of a custom Bluetooth Low Energy (BLE) service that allowed for desktop communication with the device and associated hardware for system testing. I designed a scalable, fault tolerant, architecture for a fleet management and reporting service.

 Working on these buoys and related services provided me with great opportunities to learn the embedded stack, as well as large portions of the modern web stack. I gained great project management, system architecture, and technical communication experience. This is also where I learned that I really like a fast-paced engineering environment. Product iterations on this team happened quickly and efficiently, with constant adaptations to new problems facing our buoys or interesting applications of their tech.

#### Ocean Instrumentation and Control Systems & ML Data Pipelines
At Running Tide, we relied heavily on machine learning to provide insights into the efficacy of our interventions. Whether that be through segmentation models to estimate sink rate while accounting for toss-up or camera obstructions, or macroalgae growth models for estimating carbon content of offshore macroalgae, machine learning was ubiqitous across our tech stack. 

Feeding these models requires data, and that data is spread across a variety of systems. To solve this problem I developed applications to create, aggregate, and expose data for use in machine learning operations. Specifically, I designed multiple CRUD applications for speciman tracking and metadata annotation, as well as the Onshore Research Camera Aquarium (ORCA), a lab system designed to replicate the conditions reflected in the images we received from our offshore buoys.

In designing this system I got the opportunity to lead the software architecture design, project management and stakeholder communications, end user training, and of course, actual implementation. With this project I implemented drivers for various pieces of hardware (motors, lights, cameras, etc.) and creating an intuitive, appealing UI for interfacing with the tank. Additionally, I wrote APIs for accessing collected data, an automation framework that allowed operators to define the set of photos they wanted to take and automate their collection, and provided extensive training to end users via thorough documentation and video demos. 

These projects taught me tons about the intricacies of machine learning models, data cleanliness, data efficacy, software architecture, the software development life cycle, end user training, and project maintenance. ORCA was one of the first projects that I led from inception to end user integration, and I'm happy to say it turned out quite well, improving data acquisition efficiency 25x and generating hundreds of lab images for use in machine vision models.

#### Overall

My time at Running Tide was fantastic. I learned in an incredibly fast-paced, intelligent work environment and gained engineering skills that will be crucial to my future career. In the end, the voluntary carbon market showed its teeth, and with a lack of demand for the types of credits we were generating, Running Tide was unable to secure funding for industrial scale operations and had to shut its doors in June 2024 after several months of prolonged fundraising. 

I was with Running Tide for two years from its first cage-buoy architecture deployments, through its first carbon removals (25,000 tons worth), through new locations and new coworkers, through algorithm wins and major efficiency improvements, through layoffs and site closures, and finally, to the end of the business. Running Tide was my first employer in the technical space, and I couldn't have asked for a better mission, culture, or team to fill that role.

### Familiar Technologies

Throughout my studies and career, I've gained experience in a variety of languages and technologies. I've implemented projects or parts of projects in C, C++, D, Java, Racket, JavaScript, TypeScript, Python, MIPS Assembly, Verilog, C#, and Bash. I've worked with Postgres, MongoDB, GraphQL, Express, Node, React, Flask, Django, Fast, OpenAPI, Dub, Git, Balena, Google Cloud Platform, Amazon Web Services, REST APIs, Balena, Socket.IO, CircleCI, and many more.

### This Site

Now that's a whole lot of words to say that I've worked on some cool software projects. With this site, I hope to explore more of what can be enabled by software and document my learnings. I plan to host an array of unique, small software demos that I've built in the [Showcase](/showcase) section and write blog posts about various topics. For example, I've already posted a demo and small blogpost on one of the more famous computer science problems: [Conway's Game of Life](/blog/conway). Additionally, I plan to write on larger scoped projects that I've taken on, like building a reef tank control system, and any other thoughts that I might want to put to words.

I hope you enjoy the site. If you'd like to reach out, head over to the [contact page](/contact).

Head back to the [Blog](/blog) or check out my [LinkedIn](https://www.linkedin.com/in/benmallett-/) or [GitHub](https://github.com/ben-mallett), 