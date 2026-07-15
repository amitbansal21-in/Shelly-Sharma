import {
  GraduationCap,
  BookOpen,
  Award,
  Globe
} from "lucide-react";
import { TimelineItem, QualificationItem, CourseItem, TestimonialItem, FaqItem, BlogPostItem } from "./types";

export const careerTimeline: TimelineItem[] = [
  {
    id: 1,
    year: "2016 – 2018",
    role: "Post Graduate Teacher (PGT) English",
    institution: "Kaanger Valley Academy, Raipur",
    board: "CBSE Affiliated, Day Boarding & Residential School",
    description: "Instructed Grades XI & XII in Core English. Restructured timetable scheduling matrices, directed dynamic Remedial Classes for struggling language learners, and orchestrated State-level inter-school debating events.",
    milestone: "Optimized Board-Exam passing marks to a 100% qualification rate."
  },
  {
    id: 2,
    year: "2016",
    role: "Social Studies & English Educator",
    institution: "N.H. Goel World School, Raipur",
    board: "CBSE / Cambridge Affiliated Residential School",
    description: "Delivered customized classroom units bridging spoken pronunciation training with social science curricula. Pioneered multi-sensory reading blocks in library hubs.",
    milestone: "Authored specialized interactive worksheet manuals adopted by school levels."
  },
  {
    id: 3,
    year: "2014",
    role: "Senior English & Literature Faculty",
    institution: "Orchids International School, Pune",
    board: "ICSE Board Residential Academy",
    description: "Served as premium residential faculty. Managed curriculum implementation, organized inter-house English literary festivals, and supervised evening speaking study rooms.",
    milestone: "Created comprehensive school drama scripts and directed the annual literature gala."
  },
  {
    id: 4,
    year: "2012 – 2013",
    role: "Education Consultant & Author",
    institution: "Ideal EduSystem & Aptech, Mumbai",
    board: "Curriculum Design & Corporate Training",
    description: "Authored English course materials and content grids targeting corporate soft skills, written communication, and pre-employment testing modules (CMAT/CAT patterns).",
    milestone: "Published corporate language guides adopted across multiple vocational centers."
  },
  {
    id: 5,
    year: "2010 – 2012",
    role: "Grades 7 to 12 English Teacher",
    institution: "The Learning Institute, Kolkata",
    board: "Elite Secondary Language Prep",
    description: "Engineered high-engagement grammatical clinics and speech workshops. Specialized in intensive preparation for academic boards.",
    milestone: "Mentored top-scoring state-level debate champions."
  },
  {
    id: 6,
    year: "2006 – 2010",
    role: "Senior English Instructor & Supervisor",
    institution: "St. Dominic Savio School, Howrah",
    board: "ICSE Board Co-Educational School",
    description: "Instructed middle and senior grades in ICSE English Language and Literature. Served as official exam supervisor, school magazine curator, and dramatic coach.",
    milestone: "Successfully guided over 400+ students through board examinations with distinction records."
  },
  {
    id: 7,
    year: "2003 – 2006",
    role: "Foundational English Language Teacher",
    institution: "I.P. Memorial School, Howrah",
    board: "ICSE Curriculum Preparatory",
    description: "Designed foundational language courses focusing on phonetic accuracy, cursive reading, basic spelling structures, and spoken presentation drills.",
    milestone: "Established the school's first public speaking society for young learners."
  }
];

export const qualifications: QualificationItem[] = [
  {
    degree: "Bachelor of Education (B.Ed.)",
    score: "First Class with Distinction",
    specialization: "English and History Pedagogy",
    university: "Pune University",
    year: "2014",
    icon: GraduationCap,
    highlights: "Top of her class, certified in modern lesson plan structuring and hybrid interactive teaching tools."
  },
  {
    degree: "Master of Arts (M.A.) in English",
    score: "High First Division",
    specialization: "British Literature & Linguistic History",
    university: "IGNOU",
    year: "2007",
    icon: BookOpen,
    highlights: "In-depth specialization in Shakespearean drama, Victorian poetry, and advanced structural linguistics."
  },
  {
    degree: "Bachelor of Arts (B.A.) in English",
    score: "First Class Honours",
    specialization: "English Literature & Grammar",
    university: "Calcutta University",
    year: "2003",
    icon: Award,
    highlights: "Groundwork in phonetic transcribing, language sociology, and historical writing systems."
  },
  {
    degree: "School Pedigree Background",
    score: "Excellent Board Honors",
    specialization: "St. Agnes' Convent & Loreto Day School",
    university: "Kolkata Pre-University",
    year: "1999",
    icon: Globe,
    highlights: "Cultivated a classical, impeccable pronunciation base in historic convent schools known for linguistic rigor."
  }
];

export const courses: CourseItem[] = [
  {
    id: "spoken",
    title: "Elite Spoken English Mastery",
    category: "spoken",
    ageGroup: "Professionals & College Graduates",
    duration: "12 Weeks (Group & 1-on-1 slots)",
    description: "Our signature transformation program designed to completely eliminate public speaking anxiety, neutralize accent hitches, and cultivate conversational grace.",
    curriculum: [
      "Vocal pacing & breathing exercises",
      "Overcoming speech blocks & filler words",
      "Polishing situational dialogue templates",
      "Public speaking & persuasive rhetoric"
    ],
    price: "Premium Plan Available",
    popular: true
  },
  {
    id: "grammar",
    title: "Advanced Grammar & Syntax Clinics",
    category: "academic",
    ageGroup: "Students & Aspiring Writers",
    duration: "8 Weeks Intensive",
    description: "A comprehensive course mapping structural mechanics. Master sentence anatomy, eliminate common punctuation errors, and write with scholarly precision.",
    curriculum: [
      "Deconstructing complex clause relationships",
      "Subject-Verb Agreement absolute rules",
      "Mastery of tenses and active-passive shifts",
      "Polishing high-end sentence structures"
    ],
    price: "Curriculum Enrolment Open",
    popular: false
  },
  {
    id: "interview",
    title: "High-Stakes Interview Preparation",
    category: "professional",
    ageGroup: "Corporate Job Seekers & MBA Aspirants",
    duration: "4 Weeks Boot Camp",
    description: "Learn how to structure your professional story with impact. Build executive presence, handle difficult situational questions, and command immediate confidence.",
    curriculum: [
      "Structuring answers with precision frameworks",
      "Vocal pitch, delivery pace, and posture control",
      "Handling behavioral & stress interviews",
      "Interactive mock boards with feedback sessions"
    ],
    price: "Limited Batch Seats",
    popular: false
  },
  {
    id: "business",
    title: "Corporate English & Executive Speech",
    category: "professional",
    ageGroup: "Working Executives & Business Owners",
    duration: "10 Weeks Premium",
    description: "Designed for ambitious leaders who need to present ideas clearly in international boardrooms. Perfect corporate emails, slide presentations, and negotiation language.",
    curriculum: [
      "Writing crisp, professional emails",
      "Structuring international presentations",
      "Navigating collaborative business debates",
      "Advanced professional idiom usage"
    ],
    price: "Executive Consultation Ready",
    popular: true
  },
  {
    id: "k12",
    title: "ICSE / CBSE Academic Board Prep",
    category: "academic",
    ageGroup: "Grades 9 to 12 (Board Students)",
    duration: "Full Academic Session",
    description: "Targeted school board preparations under a certified teacher. Master poetry analysis, essay writing conventions, and examination question paper strategies.",
    curriculum: [
      "Detailed analysis of board literature titles",
      "Writing structured essays & reports",
      "Unlocking high-scoring exam formats",
      "Extensive previous paper practice"
    ],
    price: "Cohort Intake in Progress",
    popular: false
  },
  {
    id: "personality",
    title: "Personality & Presentation Skills",
    category: "spoken",
    ageGroup: "Young Adults (Ages 12 to 18)",
    duration: "6 Weeks Transformation",
    description: "Build young confidence from the ground up. Focuses on social speaking, debate skills, conversational presence, and leadership presentation.",
    curriculum: [
      "Tackling stage fright exercises",
      "Expressive reading & vocal projection",
      "Building social conversation skills",
      "Modern debate presentation structures"
    ],
    price: "Parent Guides Included",
    popular: false
  }
];

export const testimonials: TestimonialItem[] = [
  {
    text: "Shelly ma'am's structured approach to grammar was a total turning point for our daughter during her ICSE Class X board preparation. Her scores improved from 72% to a remarkable 96% with distinction in English Literature! We are eternally grateful.",
    author: "Mrs. Meenakshi Joshi",
    relation: "Parent of Class X Student, Orchid International",
    rating: 5,
    board: "ICSE Curriculum"
  },
  {
    text: "As a senior software consultant, my biggest hurdle was expressing ideas clearly to global clients. Shelly's Spoken English program targeted my pronunciation pauses and vocal pacing. In just three months, I felt completely confident leading key presentation calls.",
    author: "Aditya Deshpande",
    relation: "Senior Tech Consultant, Pune",
    rating: 5,
    board: "Corporate Program"
  },
  {
    text: "The remedial classes and debate programs Shelly led at Kaanger Valley revolutionized how we structured English education. She is not just an instructor; she'ss a master curriculum architect who inspires everyone.",
    author: "Dr. S. K. Roy",
    relation: "Former Academic Dean, Kaanger Valley Academy",
    rating: 5,
    board: "Institutional Colleague"
  }
];

export const faqs: FaqItem[] = [
  {
    q: "Are the academy classes conducted online or offline?",
    a: "All interactive academy lectures, spoken workshops, and private coaching sessions are hosted online via secure high-definition video classrooms (Google Meet & Zoom integrations), making Shelly's premium pedagogy available globally."
  },
  {
    q: "What is the maximum student batch size in the Online Academy?",
    a: "To ensure personalized attention, group cohorts are strictly limited to a maximum of 6 to 8 students. Customized 1-on-1 programs are also available for working professionals and intensive board-exam tutoring."
  },
  {
    q: "How does Shelly Sharma's curriculum design approach differ from typical online tutors?",
    a: "Shelly is a university-certified B.Ed (First Class Distinction) and MA English educator with over 10 years of senior institutional experience. She utilizes the research-backed LSRW (Listening, Speaking, Reading, Writing) framework, replacing casual talk-sessions with highly structured worksheets and systematic feedback."
  },
  {
    q: "Is study material provided for CBSE / ICSE board students?",
    a: "Absolutely. All students receive access to a dedicated Google Drive resource hub containing Shelly's original literature character guides, custom grammar blueprints, step-by-step writing templates, and curated practice papers."
  },
  {
    q: "Do you offer demo classes before full program enrollment?",
    a: "Yes. Prospective parents and students can book a direct, complimentary 15-minute diagnostic consultation where Shelly evaluates speaking and reading levels and recommends a personalized learning roadmap."
  }
];

export const blogPosts: BlogPostItem[] = [
  {
    title: "Eliminating Filler Words: The 3-Step Pause Technique",
    category: "Spoken English",
    readTime: "5 min read",
    description: "How to break the habit of saying 'like, um, ah, honestly' during high-stakes presentations by adopting strategic silent pauses.",
    date: "July 2026",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600",
    content: `Filler words like "um," "ah," "like," and "you know" are common coping mechanisms when our speaking pace outruns our brain's phrasing speed. During important business presentations or public speaking, they weaken our authority and dilute the power of our ideas.

To eliminate filler words, Shelly Sharma Academy teaches students a research-backed "Selective Silence" matrix. Rather than treating silence as an awkward void, we teach you to embrace pauses as a high-status oratorical tool:

1. **Map Your Signature Fillers**: Keep a recording of your conversation or presentations. Count the occurrences of 'like' or 'um'. Understanding your personal frequency is the first step.
2. **Implement the Physical Pause**: The moment you feel the filler word rising in your throat, close your lips and take a silent breath. This momentary physical pause allows your mind to catch up to your vocal chords.
3. **Shorten Your Sentence Structures**: Long, run-on sentences are the natural home of filler words. By speaking in deliberate, shorter grammatical units, you eliminate the need to bridge thoughts with fillers.

Our interactive cohorts practice this dynamic daily using live diagnostic exercises, turning hesitant speakers into confident, persuasive communicators.`
  },
  {
    title: "ICSE Literature: Scoring a Perfect 95+ on Essay Writing",
    category: "Academic CBSE/ICSE",
    readTime: "7 min read",
    description: "A certified examiner's perspective on layout structures, literary quotes, and vocabulary guidelines that score top grades.",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600",
    content: `When marking ICSE English literature papers, board examiners seek critical depth, structured paragraphs, and textual evidence. Many capable students fail to cross the 90% threshold because they write a simple plot summary instead of a analytical essay.

To achieve perfect board scores, follow this elite strategy recommended by Shelly Sharma:

1. **Avoid Simple Plot Summaries**: The examiner already knows the play or poem. Do not waste lines rewriting what happens. Instead, analyze *why* it happens and dissect the core character motivations.
2. **Embed Precise Literary Quotes**: A score-advancing essay contains short, highly relevant quotes integrated directly into your sentence structures. For example, rather than writing a separate line for a quote, weave it in: Macbeth's vaulting ambition is described as a force that "overleaps itself."
3. **Format with Architectural Precision**: Structure your paper with a clear thesis-driven introduction, three distinct evidence-filled body paragraphs, and a reflective conclusion. 

Our specialized K-12 academic coaching programs provide students with Shelly's private literature guides, offering character breakdowns and sample high-scoring essays.`
  },
  {
    title: "Subject-Verb Agreement: Master the Trickiest Edge Cases",
    category: "English Grammar",
    readTime: "4 min read",
    description: "Stop making subtle errors with collective nouns, compound subjects, and prepositions. Complete grammatical rules explained simply.",
    date: "June 2026",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600",
    content: `Subject-Verb agreement is the cornerstone of elegant, grammatically sound English. While simple singular and plural subjects are easy to match, several complex scenarios consistently trip up students and professionals alike.

Let's deconstruct the three trickiest grammar edge cases:

1. **The Collective Noun Conundrum**: Words like 'committee', 'jury', or 'family' can take singular or plural verbs depending on context. If the group is acting as a single, unified entity, use a singular verb ("The committee *has* made its decision"). If members are acting individually, use a plural verb ("The family *are* arguing about their vacation plans").
2. **The 'Each' and 'Neither' Absolute**: Indefinite pronouns like 'each', 'neither', 'either', and 'everyone' are always singular, regardless of any modifying prepositional phrases. For example: "Each of the candidate files *is* under review" (not 'are').
3. **Subjects Joined by 'Or' or 'Nor'**: When two subjects are joined by 'or' or 'nor', the verb must agree with the subject closest to it. For example: "Neither the supervisor nor the teachers *were* present."

In our Advanced Grammar Clinics, we replace traditional memory rules with visual sentence-tree structures, enabling students to construct impeccable prose effortlessly.`
  }
];
