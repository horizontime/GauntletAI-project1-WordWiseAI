export interface WritingScore {
  overall: number; // 0-100
  breakdown: {
    grammar: number;
    clarity: number;
    engagement: number;
    delivery: number;
    cohesiveness: number;
  };
  feedback: string;
  lastCalculated: Date;
} 