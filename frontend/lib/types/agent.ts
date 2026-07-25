export interface AgentOp {
  id: string;
  title: string;
  desc?: string;

  status:
    | "pending"
    | "running"
    | "success"
    | "failed";

  progress?: number;

  startTime?: number;
  endTime?: number;

  result?: string;
}