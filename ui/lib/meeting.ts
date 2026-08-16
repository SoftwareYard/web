export interface Meeting {
  id: string;
  date: string;
  feelingAtWork: string | null;
  currentWorkload: string | null;
  thingsOutsideWork: string | null;
  problemsWithClient: string | null;
  problemsWithTeam: string | null;
  skillsToDevelop: string | null;
  growingInRole: string | null;
  trainingOpportunities: string | null;
  anythingElse: string | null;
  improvementSuggestions: string | null;
  createdAt: string;
}

export const MEETING_FIELDS: { key: keyof Meeting; label: string }[] = [
  { key: "feelingAtWork", label: "Feeling at Work" },
  { key: "currentWorkload", label: "Current Workload" },
  { key: "thingsOutsideWork", label: "Things Outside Work" },
  { key: "problemsWithClient", label: "Problems with Client" },
  { key: "problemsWithTeam", label: "Problems with Team" },
  { key: "skillsToDevelop", label: "Skills to Develop" },
  { key: "growingInRole", label: "Growing in Role" },
  { key: "trainingOpportunities", label: "Training Opportunities" },
  { key: "improvementSuggestions", label: "Improvement Suggestions" },
  { key: "anythingElse", label: "Anything Else" },
];
