/**
 * Shared UI Components
 *
 * Export all shared components for easy imports:
 * import { FormInput, TagInput, Button } from '../ui/shared';
 */

export { default as FormInput } from './FormInput';
export { default as FormSelect } from './FormSelect';
export { default as TagInput } from './TagInput';
export { default as ChipSelect } from './ChipSelect';
export { default as NumericModifierInput } from './NumericModifierInput';
export { default as CollapsibleSection } from './CollapsibleSection';
export { default as FormTabs, FormTabPanel } from './FormTabs';
export {
  default as Button,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SuccessButton,
  GhostButton,
  OutlineButton
} from './Button';

// Re-export CSS (import once to get all styles)
import './shared.css';
