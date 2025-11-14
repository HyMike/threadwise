export interface JiraConfig {
  jiraBaseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  boardId: number;
}

// Atlassian Document Format (ADF) types for Jira descriptions
export interface ADFMark {
  type:
    | "strong"
    | "em"
    | "code"
    | "underline"
    | "strike"
    | "link"
    | "textColor"
    | "subsup";
  attrs?: Record<string, any>;
}

export interface ADFTextNode {
  type: "text";
  text: string;
  marks?: ADFMark[];
}

export interface ADFParagraph {
  type: "paragraph";
  content: (ADFTextNode | ADFInlineNode)[];
}

export interface ADFHeading {
  type: "heading";
  attrs: {
    level: 1 | 2 | 3 | 4 | 5 | 6;
  };
  content: (ADFTextNode | ADFInlineNode)[];
}

export interface ADFBulletList {
  type: "bulletList";
  content: ADFListItem[];
}

export interface ADFOrderedList {
  type: "orderedList";
  content: ADFListItem[];
}

export interface ADFListItem {
  type: "listItem";
  content: (ADFParagraph | ADFHeading)[];
}

export interface ADFCodeBlock {
  type: "codeBlock";
  attrs?: {
    language?: string;
  };
  content: ADFTextNode[];
}

export type ADFInlineNode = ADFTextNode;

export type ADFBlockNode =
  | ADFParagraph
  | ADFHeading
  | ADFBulletList
  | ADFOrderedList
  | ADFCodeBlock;

export type ADFContentNode = ADFBlockNode | ADFInlineNode;

export interface ADFDocument {
  type: "doc";
  version: 1;
  content: ADFBlockNode[];
}

export interface JiraTasks {
  summary: string;
  description: string | ADFDocument;
}

export interface JiraTasksObj {
  tasks: JiraTasks[];
}
