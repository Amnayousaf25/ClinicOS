interface Props {
  error: unknown;
  touched: unknown;
}

/**
 * Inline error text under a Formik field — only renders when the field
 * has been touched AND has an error. Replaces the `FieldError` helpers
 * that were previously copy-pasted into each dialog.
 *
 * Pass `formik.errors[name]` and `formik.touched[name]` directly — no
 * generics, so this stays consumable from any Formik shape without
 * fighting TS inference.
 */
export const FormikFieldError = ({ error, touched }: Props) => {
  if (!touched || !error || typeof error !== 'string') return null;
  return <p className="text-xs text-destructive mt-1">{error}</p>;
};
