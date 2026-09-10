export interface PilgrimFields {
  name: string;
  phone: string;
  aadharNumber: string;
  password: string;
  age: string;
  photoBase64: string | null;
  samagraId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  medicalHistory: string;
}

export const emptyPilgrimFields: PilgrimFields = {
  name: "",
  phone: "",
  aadharNumber: "",
  password: "",
  age: "",
  photoBase64: null,
  samagraId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  medicalHistory: "",
};
