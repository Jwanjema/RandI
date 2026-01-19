import { useState } from 'react';

// Validation rules
export const validationRules = {
  required: (value) => {
    if (typeof value === 'string') return value.trim() !== '';
    return value !== null && value !== undefined && value !== '';
  },
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  phone: (value) => {
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(value);
  },
  minLength: (min) => (value) => {
    return value && value.length >= min;
  },
  maxLength: (max) => (value) => {
    return value && value.length <= max;
  },
  min: (minValue) => (value) => {
    return parseFloat(value) >= minValue;
  },
  max: (maxValue) => (value) => {
    return parseFloat(value) <= maxValue;
  },
  numeric: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
  alphanumeric: (value) => {
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
    return alphanumericRegex.test(value);
  },
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  date: (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },
  futureDate: (value) => {
    const date = new Date(value);
    return date > new Date();
  },
  pastDate: (value) => {
    const date = new Date(value);
    return date < new Date();
  }
};

// Error messages
const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must be no more than ${max} characters`,
  min: (minValue) => `Must be at least ${minValue}`,
  max: (maxValue) => `Must be no more than ${maxValue}`,
  numeric: 'Please enter a valid number',
  alphanumeric: 'Only letters and numbers are allowed',
  url: 'Please enter a valid URL',
  date: 'Please enter a valid date',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past'
};

// Custom hook for form validation
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = (name, value) => {
    const fieldRules = validationSchema[name];
    if (!fieldRules) return '';

    for (const rule of fieldRules) {
      const { validator, message, params } = rule;
      
      let isValid = false;
      if (typeof validator === 'string') {
        const validatorFn = validationRules[validator];
        isValid = params ? validatorFn(params)(value) : validatorFn(value);
      } else {
        isValid = validator(value, values);
      }

      if (!isValid) {
        if (message) return message;
        if (typeof validator === 'string') {
          const defaultMessage = errorMessages[validator];
          return typeof defaultMessage === 'function' ? defaultMessage(params) : defaultMessage;
        }
        return 'Invalid value';
      }
    }
    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({ ...prev, [name]: newValue }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle input blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submit
  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationSchema).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    const isValid = validateForm();
    
    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  };

  // Reset form
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Set field value programmatically
  const setFieldValue = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  // Set field error programmatically
  const setFieldError = (name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    validateForm
  };
};

// Helper component for form fields with validation
export const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  error, 
  touched, 
  required,
  ...props 
}) => {
  const showError = touched && error;
  
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        className={showError ? 'error' : ''}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? `${name}-error` : undefined}
        {...props}
      />
      {showError && (
        <span 
          id={`${name}-error`}
          className="error-message"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default useFormValidation;
