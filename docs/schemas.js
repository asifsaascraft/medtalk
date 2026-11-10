export const schemas = {

Speciality: {
  type: "object",
  properties: {
    _id: {
      type: "string",
      example: "672a12345678901234567890",
    },
    specialityName: {
      type: "string",
      example: "Cardiology",
    },
    createdAt: {
      type: "string",
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
  },
},


};

export default schemas;