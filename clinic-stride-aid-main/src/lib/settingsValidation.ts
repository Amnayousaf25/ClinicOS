import * as Yup from 'yup';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const clinicSettingsSchema = Yup.object({
  clinicName: Yup.string().trim().required('Clinic name is required'),
  startHour: Yup.string()
    .matches(timeRegex, 'Use HH:mm')
    .required('Opening time is required'),
  endHour: Yup.string()
    .matches(timeRegex, 'Use HH:mm')
    .required('Closing time is required')
    .test(
      'after-start',
      'Closing must be after opening',
      function (value) {
        const { startHour } = this.parent as { startHour?: string };
        if (!value || !startHour) return true;
        return value > startHour;
      },
    ),
  slotDuration: Yup.number()
    .min(5, 'Slot duration must be at least 5 minutes')
    .max(240, 'Slot duration is too long')
    .required('Slot duration is required'),
  timeFormat: Yup.mixed<'12' | '24'>().oneOf(['12', '24']).required(),
});

export const serviceSchema = Yup.object({
  name: Yup.string().trim().required('Service name is required'),
  duration: Yup.number()
    .min(1, 'Duration must be at least 1 minute')
    .required('Duration is required'),
  price: Yup.number()
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  category: Yup.string().trim().required('Category is required'),
});

export const providerSchema = Yup.object({
  name: Yup.string().trim().required('Provider name is required'),
  title: Yup.string().trim(),
  serviceId: Yup.string(),
});

export const insuranceProviderSchema = Yup.object({
  name: Yup.string().trim().required('Provider name is required'),
});

export const blockSlotSchema = Yup.object({
  date: Yup.string()
    .matches(dateRegex, 'Date must be YYYY-MM-DD')
    .required('Date is required'),
  time: Yup.string()
    .matches(timeRegex, 'Use HH:mm')
    .required('Time is required'),
  reason: Yup.string().trim(),
});
