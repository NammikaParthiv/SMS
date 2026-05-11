export const SUBJECTS = [
  "maths",
  "physics",
  "chemistry",
  "social",
  "biology",
  "english",
  "hindi",
];

export const subjectLabel = (value = "") =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";

export const SUBJECT_EMOJIS = {
  maths: "🧮",
  physics: "⚡",
  chemistry: "🧪",
  social: "🌍",
  biology: "🧬",
  english: "📚",
  hindi: "📝",
};

export const subjectLabelWithEmoji = (value = "") => {
  const key = String(value || "").toLowerCase();
  const emoji = SUBJECT_EMOJIS[key] || "📘";
  return `${emoji} ${subjectLabel(value)}`;
};
