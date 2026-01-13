export const TAG_COLORS = {
  Valorant: {
    bg: "bg-red-800",
    text: "text-red-200",
  },
  "League of Legends": {
    bg: "bg-green-800",
    text: "text-green-200",
  },
  "Apex Legends": {
    bg: "bg-yellow-800",
    text: "text-yellow-200",
  },
  Coaching: {
    bg: "bg-blue-800",
    text: "text-blue-200",
  },
  Piloting: {
    bg: "bg-purple-800",
    text: "text-purple-200",
  },
};

export const getTagColors = (tag) => {
  return (
    TAG_COLORS[tag] || {
      bg: "bg-gray-800",
      text: "text-gray-200",
    }
  );
};
