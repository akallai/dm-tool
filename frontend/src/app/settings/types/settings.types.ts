export type SettingsFieldType =
  | 'text'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'file'
  | 'textarea'
  | 'mapping'
  | 'readonly-text'
  | 'file-button';

export interface BaseFieldConfig {
  key: string;
  type: SettingsFieldType;
  label?: string;
  required?: boolean;
  defaultValue?: any;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  placeholder?: string;
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  min?: number;
  max?: number;
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: { value: any; label: string }[];
}

export interface FileFieldConfig extends BaseFieldConfig {
  type: 'file';
  accept?: string;
  multiple?: boolean;
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  placeholder?: string;
  rows?: number;
}

export interface MappingFieldConfig extends BaseFieldConfig {
  type: 'mapping';
  mappingConfig: {
    keyLabel: string;
    valueType: 'text' | 'file' | 'textarea' | 'checkbox';
    valueLabel: string;
    fileAccept?: string;
    multiple?: boolean;
    directory?: boolean;
  };
}

export interface ReadonlyTextFieldConfig extends BaseFieldConfig {
  type: 'readonly-text';
}

export interface FileButtonFieldConfig extends BaseFieldConfig {
  type: 'file-button';
  label: string;
  buttonText?: string;
  accept?: string;
}

export type SettingsField =
  | TextFieldConfig
  | NumberFieldConfig
  | CheckboxFieldConfig
  | SelectFieldConfig
  | FileFieldConfig
  | TextareaFieldConfig
  | MappingFieldConfig
  | ReadonlyTextFieldConfig
  | FileButtonFieldConfig;

export interface SettingsConfig {
  title: string;
  fields: SettingsField[];
}

export interface SettingsData {
  config: SettingsConfig;
  settings: any;
}