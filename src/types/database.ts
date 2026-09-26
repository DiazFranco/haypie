export type Mesa = {
  id: string;
  name: string;
  join_code: string;
  pin: string;
  players: Player[];
  created_at: string;
};

export type Player = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  mesa_id: string;
  target_points: number;
  team_a_players: string[];
  team_b_players: string[];
  team_a_score: number;
  team_b_score: number;
  winner: 'team_a' | 'team_b' | 'draw';
  started_at: string;
  finished_at: string | null;
};

export type MatchEvent = {
  team: 'team_a' | 'team_b';
  points: number;
  created_at: string;
};