import styles from "./Form.module.css";

type FormProps = React.FormHTMLAttributes<HTMLFormElement>;

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

type FormSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
};

type FormRowProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
};

export function Form({ className, ...props }: FormProps) {
  return (
    <form className={`${styles.form} ${className ?? ""}`.trim()} {...props} />
  );
}

export function FormRow({ children, columns = 2, className }: FormRowProps) {
  return (
    <div
      className={`${styles.row} ${className ?? ""}`.trim()}
      style={{ ["--form-columns" as string]: columns }}
    >
      {children}
    </div>
  );
}

export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${styles.control} ${className ?? ""}`.trim()}
      {...props}
    />
  );
}

export function FormSelect({ className, options, ...props }: FormSelectProps) {
  return (
    <select
      className={`${styles.control} ${className ?? ""}`.trim()}
      {...props}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${styles.control} ${className ?? ""}`.trim()}
      {...props}
    />
  );
}
