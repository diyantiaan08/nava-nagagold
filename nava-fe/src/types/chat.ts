export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export type Theme = 'blue' | 'orange' | 'green' | 'purple';

export interface ThemeColors {
  primary: string;
  secondary: string;
  gradient: string;
  hover: string;
}
