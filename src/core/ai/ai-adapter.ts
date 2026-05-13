export interface IAiAdapter {
  generate(prompt: string): Promise<string>;
  isReal(): boolean;
}
