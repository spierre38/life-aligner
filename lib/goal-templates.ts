// lib/goal-templates.ts
// Goal suggestion templates for roadmap builder
// Each template includes pre-written goals with activities for quick setup

export interface GoalTemplate {
  id: string;
  goal: string;
  description: string;
  activities: string[];
  difficulty: 'easy' | 'medium' | 'challenging';
  timeframe: '1-month' | '3-month' | '6-month' | '1-year';
}

export interface CategoryTemplates {
  [category: string]: GoalTemplate[];
}

export const GOAL_TEMPLATES: CategoryTemplates = {
  // ============================================================================
  // HEALTH - Physical and mental wellness
  // ============================================================================
  Health: [
    {
      id: 'health_1',
      goal: "Exercise 3x per week",
      description: "Build consistent fitness habit",
      activities: [
        "Monday morning workout",
        "Wednesday cardio session",
        "Saturday strength training"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'health_2',
      goal: "Drink 8 glasses of water daily",
      description: "Stay hydrated throughout the day",
      activities: [
        "Morning: 2 glasses with breakfast",
        "Midday: 3 glasses during work",
        "Evening: 3 glasses with dinner"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'health_3',
      goal: "Sleep 8 hours nightly",
      description: "Establish healthy sleep routine",
      activities: [
        "Set consistent 10pm bedtime",
        "No screens 1 hour before bed",
        "Wake up at 6am daily"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'health_4',
      goal: "Walk 10,000 steps daily",
      description: "Increase daily movement",
      activities: [
        "Morning walk after breakfast",
        "Lunch break walking meeting",
        "Evening neighborhood stroll"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'health_5',
      goal: "Meal prep healthy lunches",
      description: "Eat nutritious meals consistently",
      activities: [
        "Sunday grocery shopping",
        "Sunday afternoon meal prep",
        "Pack lunch night before"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'health_6',
      goal: "Practice meditation 10 min daily",
      description: "Reduce stress and improve focus",
      activities: [
        "Morning meditation after waking",
        "Use meditation app",
        "Track daily in journal"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'health_7',
      goal: "Reduce sugar intake",
      description: "Improve diet quality",
      activities: [
        "Replace soda with water",
        "No dessert on weekdays",
        "Read nutrition labels"
      ],
      difficulty: 'challenging',
      timeframe: '3-month'
    },
    {
      id: 'health_8',
      goal: "Stretch 15 minutes daily",
      description: "Improve flexibility and reduce pain",
      activities: [
        "Morning full-body stretch routine",
        "Evening yoga session",
        "Desk stretches during work breaks"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    }
  ],

  // ============================================================================
  // CAREER - Professional growth and advancement
  // ============================================================================
  Career: [
    {
      id: 'career_1',
      goal: "Get promoted within 1 year",
      description: "Advance your career trajectory",
      activities: [
        "Schedule monthly 1-on-1 with manager",
        "Lead a high-visibility project",
        "Complete leadership training course"
      ],
      difficulty: 'challenging',
      timeframe: '1-year'
    },
    {
      id: 'career_2',
      goal: "Learn a new professional skill",
      description: "Expand your capabilities",
      activities: [
        "Enroll in online course",
        "Practice 3x per week",
        "Build portfolio project"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    },
    {
      id: 'career_3',
      goal: "Network with 5 industry peers monthly",
      description: "Build professional relationships",
      activities: [
        "Attend 2 networking events per month",
        "Schedule 3 coffee chats monthly",
        "Engage on LinkedIn weekly"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'career_4',
      goal: "Update resume and LinkedIn profile",
      description: "Improve professional presence",
      activities: [
        "Rewrite resume with recent achievements",
        "Update LinkedIn with new skills",
        "Get 3 recommendations from colleagues"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'career_5',
      goal: "Negotiate a salary increase",
      description: "Get paid what you're worth",
      activities: [
        "Research market rates for your role",
        "Document your achievements and value",
        "Schedule meeting with manager"
      ],
      difficulty: 'challenging',
      timeframe: '3-month'
    },
    {
      id: 'career_6',
      goal: "Start a side project or business",
      description: "Explore entrepreneurship",
      activities: [
        "Validate business idea with 10 people",
        "Build MVP or prototype",
        "Get first paying customer"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'career_7',
      goal: "Become a subject matter expert",
      description: "Establish thought leadership",
      activities: [
        "Write 1 blog post monthly",
        "Present at team meetings",
        "Share insights on social media"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    },
    {
      id: 'career_8',
      goal: "Improve work-life balance",
      description: "Set healthy boundaries",
      activities: [
        "Leave work by 5:30pm daily",
        "No work emails after 7pm",
        "Take full lunch break away from desk"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    }
  ],

  // ============================================================================
  // RELATIONSHIPS - Personal connections and intimacy
  // ============================================================================
  Relationships: [
    {
      id: 'relationships_1',
      goal: "Weekly date night with partner",
      description: "Strengthen romantic relationship",
      activities: [
        "Schedule Friday night date",
        "Take turns planning activities",
        "Try 1 new restaurant monthly"
      ],
      difficulty: 'easy',
      timeframe: '3-month'
    },
    {
      id: 'relationships_2',
      goal: "Call parents/family weekly",
      description: "Maintain family connections",
      activities: [
        "Sunday evening family call",
        "Share photos and updates",
        "Plan quarterly family visit"
      ],
      difficulty: 'easy',
      timeframe: '3-month'
    },
    {
      id: 'relationships_3',
      goal: "Reconnect with 1 old friend monthly",
      description: "Revive meaningful friendships",
      activities: [
        "Reach out via text or call",
        "Schedule coffee or video chat",
        "Share life updates and listen"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'relationships_4',
      goal: "Plan a trip with loved ones",
      description: "Create shared memories",
      activities: [
        "Choose destination together",
        "Book flights and accommodation",
        "Create itinerary and activities"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    },
    {
      id: 'relationships_5',
      goal: "Practice active listening daily",
      description: "Improve communication quality",
      activities: [
        "Put phone away during conversations",
        "Ask follow-up questions",
        "Reflect back what you heard"
      ],
      difficulty: 'medium',
      timeframe: '1-month'
    },
    {
      id: 'relationships_6',
      goal: "Express gratitude to loved ones",
      description: "Show appreciation regularly",
      activities: [
        "Tell partner 1 thing you appreciate daily",
        "Send thank you texts to friends",
        "Write appreciation notes weekly"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'relationships_7',
      goal: "Resolve a long-standing conflict",
      description: "Heal damaged relationship",
      activities: [
        "Initiate conversation with openness",
        "Listen to their perspective",
        "Apologize for your part"
      ],
      difficulty: 'challenging',
      timeframe: '3-month'
    },
    {
      id: 'relationships_8',
      goal: "Host monthly gatherings",
      description: "Bring people together",
      activities: [
        "Plan game night or dinner party",
        "Invite 4-6 friends or family",
        "Create welcoming atmosphere"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    }
  ],

  // ============================================================================
  // PURPOSE - Making a positive impact
  // ============================================================================
  Purpose: [
    {
      id: 'purpose_1',
      goal: "Volunteer 4 hours monthly",
      description: "Give back to community",
      activities: [
        "Research local volunteer opportunities",
        "Sign up for regular volunteer shift",
        "Track hours and reflect on impact"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'purpose_2',
      goal: "Mentor someone in my field",
      description: "Share knowledge and experience",
      activities: [
        "Join mentorship program",
        "Meet with mentee monthly",
        "Provide guidance and feedback"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    },
    {
      id: 'purpose_3',
      goal: "Donate to causes I believe in",
      description: "Support important work",
      activities: [
        "Research 3 effective charities",
        "Set up monthly recurring donations",
        "Donate 5% of income"
      ],
      difficulty: 'medium',
      timeframe: '1-month'
    },
    {
      id: 'purpose_4',
      goal: "Reduce environmental impact",
      description: "Live more sustainably",
      activities: [
        "Switch to reusable bags and bottles",
        "Reduce meat consumption 3x/week",
        "Bike or walk instead of drive"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'purpose_5',
      goal: "Help 1 person solve a problem weekly",
      description: "Be of service to others",
      activities: [
        "Ask 'How can I help?' daily",
        "Offer expertise or time",
        "Connect people who need each other"
      ],
      difficulty: 'easy',
      timeframe: '3-month'
    },
    {
      id: 'purpose_6',
      goal: "Create something that helps others",
      description: "Build lasting value",
      activities: [
        "Identify problem you can solve",
        "Build tool, guide, or resource",
        "Share freely with those who need it"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'purpose_7',
      goal: "Advocate for a cause",
      description: "Use your voice for change",
      activities: [
        "Learn about the issue deeply",
        "Contact representatives monthly",
        "Share information with network"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    },
    {
      id: 'purpose_8',
      goal: "Practice random acts of kindness",
      description: "Spread positivity",
      activities: [
        "Pay for stranger's coffee weekly",
        "Leave encouraging notes",
        "Offer help without being asked"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    }
  ],

  // ============================================================================
  // SOCIAL - Community and friendships
  // ============================================================================
  Social: [
    {
      id: 'social_1',
      goal: "Join a club or group activity",
      description: "Meet new people with shared interests",
      activities: [
        "Research local clubs or meetups",
        "Attend first meeting",
        "Commit to attending monthly"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'social_2',
      goal: "Say yes to social invitations",
      description: "Be more socially active",
      activities: [
        "Accept next 3 invitations received",
        "Initiate plans with others",
        "Stay for full event (don't leave early)"
      ],
      difficulty: 'medium',
      timeframe: '1-month'
    },
    {
      id: 'social_3',
      goal: "Make 3 new friends",
      description: "Expand social circle",
      activities: [
        "Strike up conversations in new places",
        "Exchange contact info",
        "Follow up within 48 hours"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'social_4',
      goal: "Host a monthly social event",
      description: "Bring people together",
      activities: [
        "Choose activity (dinner, game night, etc)",
        "Send invitations 2 weeks ahead",
        "Prepare and host event"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'social_5',
      goal: "Attend networking events",
      description: "Build professional and social connections",
      activities: [
        "Find 2 events per month",
        "Prepare elevator pitch",
        "Follow up with 3 people met"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'social_6',
      goal: "Improve conversation skills",
      description: "Become better at small talk",
      activities: [
        "Practice asking open-ended questions",
        "Read 1 book on communication",
        "Initiate conversations with strangers"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'social_7',
      goal: "Organize a group outing",
      description: "Plan fun activities with friends",
      activities: [
        "Choose activity (hiking, concert, etc)",
        "Coordinate schedules",
        "Handle logistics and reservations"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'social_8',
      goal: "Be more vulnerable with others",
      description: "Deepen connections through authenticity",
      activities: [
        "Share something personal in conversations",
        "Ask for help when needed",
        "Express feelings honestly"
      ],
      difficulty: 'challenging',
      timeframe: '3-month'
    }
  ],

  // ============================================================================
  // LEARNING - Education and skill development
  // ============================================================================
  Learning: [
    {
      id: 'learning_1',
      goal: "Read 12 books this year",
      description: "Expand knowledge and perspective",
      activities: [
        "Read 30 minutes before bed",
        "Join book club for accountability",
        "Track books in reading app"
      ],
      difficulty: 'medium',
      timeframe: '1-year'
    },
    {
      id: 'learning_2',
      goal: "Learn a new language",
      description: "Become conversational in 6 months",
      activities: [
        "Practice on Duolingo 15 min daily",
        "Watch shows in target language",
        "Find language exchange partner"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'learning_3',
      goal: "Take an online course",
      description: "Gain new skills or knowledge",
      activities: [
        "Choose course in area of interest",
        "Schedule 2 hours weekly for lessons",
        "Complete course and get certificate"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'learning_4',
      goal: "Learn to code or improve coding skills",
      description: "Develop technical capabilities",
      activities: [
        "Complete coding tutorial daily",
        "Build 1 personal project",
        "Contribute to open source"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'learning_5',
      goal: "Master a musical instrument",
      description: "Develop musical ability",
      activities: [
        "Practice 20 minutes daily",
        "Take weekly lessons",
        "Learn 3 complete songs"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'learning_6',
      goal: "Listen to educational podcasts",
      description: "Learn during commute or exercise",
      activities: [
        "Subscribe to 3 educational podcasts",
        "Listen during morning walk",
        "Take notes on key insights"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'learning_7',
      goal: "Attend workshops or seminars",
      description: "Learn from experts",
      activities: [
        "Sign up for 1 workshop monthly",
        "Take detailed notes",
        "Apply 1 lesson immediately"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'learning_8',
      goal: "Study a topic deeply",
      description: "Become knowledgeable in specific area",
      activities: [
        "Read 5 books on the topic",
        "Watch documentaries and lectures",
        "Teach what you learned to someone"
      ],
      difficulty: 'medium',
      timeframe: '6-month'
    }
  ],

  // ============================================================================
  // FINANCE - Money management and wealth building
  // ============================================================================
  Finance: [
    {
      id: 'finance_1',
      goal: "Save $5,000 for emergency fund",
      description: "Build financial security",
      activities: [
        "Set up automatic savings transfer",
        "Save $400 per month",
        "Keep in high-yield savings account"
      ],
      difficulty: 'medium',
      timeframe: '1-year'
    },
    {
      id: 'finance_2',
      goal: "Create and stick to budget",
      description: "Track and control spending",
      activities: [
        "Track all expenses for 1 month",
        "Create realistic budget",
        "Review weekly and adjust"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'finance_3',
      goal: "Pay off credit card debt",
      description: "Eliminate high-interest debt",
      activities: [
        "List all debts and interest rates",
        "Pay minimum on all, extra on highest rate",
        "Avoid new credit card charges"
      ],
      difficulty: 'challenging',
      timeframe: '1-year'
    },
    {
      id: 'finance_4',
      goal: "Start investing for retirement",
      description: "Build long-term wealth",
      activities: [
        "Open 401k or IRA account",
        "Set up automatic contributions",
        "Invest in index funds"
      ],
      difficulty: 'medium',
      timeframe: '1-month'
    },
    {
      id: 'finance_5',
      goal: "Increase income by 20%",
      description: "Earn more money",
      activities: [
        "Negotiate raise at current job",
        "Start side hustle or freelance",
        "Develop high-value skills"
      ],
      difficulty: 'challenging',
      timeframe: '1-year'
    },
    {
      id: 'finance_6',
      goal: "Reduce monthly expenses by $300",
      description: "Cut unnecessary spending",
      activities: [
        "Cancel unused subscriptions",
        "Cook at home instead of eating out",
        "Comparison shop for insurance"
      ],
      difficulty: 'medium',
      timeframe: '1-month'
    },
    {
      id: 'finance_7',
      goal: "Learn about investing",
      description: "Improve financial literacy",
      activities: [
        "Read 3 books on investing",
        "Follow financial news weekly",
        "Take investing course online"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'finance_8',
      goal: "Build passive income stream",
      description: "Earn money while you sleep",
      activities: [
        "Research passive income options",
        "Start rental property or dividend investing",
        "Reinvest earnings to grow"
      ],
      difficulty: 'challenging',
      timeframe: '1-year'
    }
  ],

  // ============================================================================
  // SPIRITUAL - Inner growth and meaning
  // ============================================================================
  Spiritual: [
    {
      id: 'spiritual_1',
      goal: "Establish daily meditation practice",
      description: "Cultivate inner peace",
      activities: [
        "Meditate 10 minutes each morning",
        "Use guided meditation app",
        "Journal about experiences"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'spiritual_2',
      goal: "Practice gratitude daily",
      description: "Develop appreciation mindset",
      activities: [
        "Write 3 gratitudes each morning",
        "Share appreciation with others",
        "Reflect on blessings before bed"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'spiritual_3',
      goal: "Attend religious or spiritual services",
      description: "Connect with faith community",
      activities: [
        "Attend weekly services",
        "Participate in study groups",
        "Volunteer with faith community"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'spiritual_4',
      goal: "Read spiritual or philosophical texts",
      description: "Deepen understanding of meaning",
      activities: [
        "Read 15 minutes daily",
        "Reflect on teachings",
        "Discuss insights with others"
      ],
      difficulty: 'easy',
      timeframe: '3-month'
    },
    {
      id: 'spiritual_5',
      goal: "Spend time in nature regularly",
      description: "Connect with natural world",
      activities: [
        "Take weekly nature walk",
        "Practice mindfulness outdoors",
        "Notice beauty and wonder"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'spiritual_6',
      goal: "Practice forgiveness",
      description: "Release resentment and pain",
      activities: [
        "Identify person or situation to forgive",
        "Write forgiveness letter (don't send)",
        "Let go of grudge consciously"
      ],
      difficulty: 'challenging',
      timeframe: '3-month'
    },
    {
      id: 'spiritual_7',
      goal: "Explore your purpose and values",
      description: "Clarify what matters most",
      activities: [
        "Complete LifeFrame exercises",
        "Journal about values weekly",
        "Align actions with purpose"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'spiritual_8',
      goal: "Practice loving-kindness",
      description: "Cultivate compassion",
      activities: [
        "Send loving thoughts to self and others",
        "Perform acts of kindness weekly",
        "Respond with compassion to difficulties"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    }
  ],

  // ============================================================================
  // CREATIVE - Artistic expression and creativity
  // ============================================================================
  Creative: [
    {
      id: 'creative_1',
      goal: "Start a creative hobby",
      description: "Express yourself artistically",
      activities: [
        "Choose medium (painting, writing, music, etc)",
        "Practice 30 minutes 3x per week",
        "Share work with supportive friend"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'creative_2',
      goal: "Write in journal daily",
      description: "Process thoughts and emotions creatively",
      activities: [
        "Morning pages - 3 pages freewriting",
        "Evening reflection",
        "Weekly review of entries"
      ],
      difficulty: 'easy',
      timeframe: '1-month'
    },
    {
      id: 'creative_3',
      goal: "Create and finish a project",
      description: "Bring creative vision to life",
      activities: [
        "Define project scope and timeline",
        "Work on it weekly",
        "Complete and share final product"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'creative_4',
      goal: "Take a creative class",
      description: "Learn new artistic skill",
      activities: [
        "Enroll in photography, art, or writing class",
        "Complete all assignments",
        "Apply techniques regularly"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'creative_5',
      goal: "Start a blog or YouTube channel",
      description: "Share creative work with world",
      activities: [
        "Choose topic and platform",
        "Create 1 piece of content weekly",
        "Build audience over time"
      ],
      difficulty: 'challenging',
      timeframe: '6-month'
    },
    {
      id: 'creative_6',
      goal: "Visit museums and galleries",
      description: "Get inspired by others' creativity",
      activities: [
        "Visit 1 museum or gallery monthly",
        "Take time to really observe art",
        "Journal about what moves you"
      ],
      difficulty: 'easy',
      timeframe: '3-month'
    },
    {
      id: 'creative_7',
      goal: "Join creative community",
      description: "Connect with other creatives",
      activities: [
        "Find local writing group, art collective, etc",
        "Attend meetings monthly",
        "Collaborate on project"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    },
    {
      id: 'creative_8',
      goal: "Make creativity a daily practice",
      description: "Build creative muscle",
      activities: [
        "15 minutes creative time daily",
        "Try different creative exercises",
        "Keep creativity journal"
      ],
      difficulty: 'medium',
      timeframe: '3-month'
    }
  ]
};

// Helper function to get templates for a specific category
export function getTemplatesForCategory(category: string): GoalTemplate[] {
  return GOAL_TEMPLATES[category] || [];
}

// Helper function to get all category names that have templates
export function getAvailableCategories(): string[] {
  return Object.keys(GOAL_TEMPLATES);
}

// Helper function to filter templates by difficulty
export function filterByDifficulty(
  templates: GoalTemplate[], 
  difficulty: 'easy' | 'medium' | 'challenging'
): GoalTemplate[] {
  return templates.filter(t => t.difficulty === difficulty);
}

// Helper function to filter templates by timeframe
export function filterByTimeframe(
  templates: GoalTemplate[], 
  timeframe: '1-month' | '3-month' | '6-month' | '1-year'
): GoalTemplate[] {
  return templates.filter(t => t.timeframe === timeframe);
}
