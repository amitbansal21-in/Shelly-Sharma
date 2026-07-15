import React from "react";

export interface TimelineItem {
  id: number;
  year: string;
  role: string;
  institution: string;
  board: string;
  description: string;
  milestone: string;
}

export interface QualificationItem {
  degree: string;
  score: string;
  specialization: string;
  university: string;
  year: string;
  icon: any; // Lucide icon component type
  highlights: string;
}

export interface CourseItem {
  id: string;
  title: string;
  category: "spoken" | "academic" | "professional";
  ageGroup: string;
  duration: string;
  description: string;
  curriculum: string[];
  price: string;
  popular: boolean;
}

export interface TestimonialItem {
  text: string;
  author: string;
  relation: string;
  rating: number;
  board: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BlogPostItem {
  title: string;
  category: string;
  readTime: string;
  description: string;
  date: string;
  content?: string; // Optional detailed content for blog viewer
  image?: string;
}
