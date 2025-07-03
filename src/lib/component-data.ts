export type ComponentCategory = 'Layout' | 'Forms' | 'Overlays' | 'Navigation' | 'Display';

export type ComponentData = {
  name: string;
  description: string;
  category: ComponentCategory;
  href: string;
  icon: string;
};

const componentsList: Omit<ComponentData, 'category' | 'href' | 'icon'>[] = [
    { name: 'Accordion', description: 'A vertically stacked set of interactive headings that each reveal a section of content.' },
    { name: 'Alert', description: 'Displays a callout for user attention.' },
    { name: 'Alert Dialog', description: 'A modal dialog that interrupts the user with important content and expects a response.' },
    { name: 'Avatar', description: 'An image element with a fallback for representing a user.' },
    { name: 'Badge', description: 'Small count and labeling component.' },
    { name: 'Button', description: 'Displays a button or a link.' },
    { name: 'Calendar', description: 'A calendar component that allows users to select a date.' },
    { name: 'Card', description: 'Displays a card with header, content, and footer.' },
    { name: 'Carousel', description: 'A carousel with motion and swipe built using Embla.' },
    { name: 'Checkbox', description: 'A control that allows the user to toggle between checked and not checked.' },
    { name: 'Collapsible', description: 'An interactive component which expands/collapses a content.' },
    { name: 'Dialog', description: 'A window overlaid on either the primary window or another dialog window.' },
    { name: 'Dropdown Menu', description: 'Displays a menu to the user — such as a set of actions or functions — triggered by a button.' },
    { name: 'Input', description: 'Displays a form input field or a component that looks like an input field.' },
    { name: 'Label', description: 'Renders an accessible label associated with controls.' },
    { name: 'Menubar', description: 'A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.' },
    { name: 'Popover', description: 'Displays rich content in a portal, triggered by a button.' },
    { name: 'Progress', description: 'Displays an indicator showing the completion progress of a task.' },
    { name: 'Radio Group', description: 'A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time.' },
    { name: 'Scroll Area', description: 'Augments native scroll functionality for custom, cross-browser styling.' },
    { name: 'Select', description: 'Displays a list of options for the user to pick from—triggered by a button.' },
    { name: 'Separator', description: 'A visual separator between content.' },
    { name: 'Sheet', description: 'Extends the Dialog component to display content that complements the main content of the screen.' },
    { name: 'Skeleton', description: 'Use to show a placeholder while content is loading.' },
    { name: 'Slider', description: 'A control that allows the user to select a value from a range.' },
    { name: 'Switch', description: 'A control that allows the user to toggle between checked and not checked.' },
    { name: 'Table', description: 'A responsive table component.' },
    { name: 'Tabs', description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.' },
    { name: 'Textarea', description: 'Displays a form textarea field.' },
    { name: 'Toast', description: 'A succinct message that is displayed temporarily.' },
    { name: 'Tooltip', description: 'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.' },
];

const componentCategories: Record<string, { category: ComponentCategory, icon: string }> = {
  Accordion: { category: 'Display', icon: 'ChevronDownSquare' },
  Alert: { category: 'Display', icon: 'AlertCircle' },
  'Alert Dialog': { category: 'Overlays', icon: 'MessageSquareWarning' },
  Avatar: { category: 'Display', icon: 'User' },
  Badge: { category: 'Display', icon: 'Badge' },
  Button: { category: 'Forms', icon: 'MousePointerClick' },
  Calendar: { category: 'Forms', icon: 'CalendarDays' },
  Card: { category: 'Layout', icon: 'Layout' },
  Carousel: { category: 'Display', icon: 'Image' },
  Checkbox: { category: 'Forms', icon: 'CheckSquare' },
  Collapsible: { category: 'Display', icon: 'ChevronDownSquare' },
  Dialog: { category: 'Overlays', icon: 'SquareArrowOutUpRight' },
  'Dropdown Menu': { category: 'Navigation', icon: 'ChevronDownSquare' },
  Input: { category: 'Forms', icon: 'FormInput' },
  Label: { category: 'Forms', icon: 'Text' },
  Menubar: { category: 'Navigation', icon: 'Navigation' },
  Popover: { category: 'Overlays', icon: 'PanelTop' },
  Progress: { category: 'Display', icon: 'Loader' },
  'Radio Group': { category: 'Forms', icon: 'RadioTower' },
  'Scroll Area': { category: 'Layout', icon: 'GalleryVertical' },
  Select: { category: 'Forms', icon: 'ChevronDownSquare' },
  Separator: { category: 'Layout', icon: 'SeparatorHorizontal' },
  Sheet: { category: 'Overlays', icon: 'PanelTop' },
  Skeleton: { category: 'Display', icon: 'Layout' },
  Slider: { category: 'Forms', icon: 'SlidersHorizontal' },
  Switch: { category: 'Forms', icon: 'ToggleRight' },
  Table: { category: 'Display', icon: 'Table' },
  Tabs: { category: 'Display', icon: 'LayoutPanelTop' },
  Textarea: { category: 'Forms', icon: 'Text' },
  Toast: { category: 'Overlays', icon: 'MessageSquare' },
  Tooltip: { category: 'Display', icon: 'Info' },
};


export const components: ComponentData[] = componentsList.map(comp => {
  const categoryInfo = componentCategories[comp.name] || { category: 'Display', icon: 'AlertCircle' };
  return {
    ...comp,
    ...categoryInfo,
    href: `/${comp.name.toLowerCase().replace(/\s+/g, '-')}`,
  };
});

export const categories = (Object.keys(componentCategories).reduce((acc, key) => {
    const category = componentCategories[key].category;
    if (!acc.includes(category)) {
        acc.push(category);
    }
    return acc;
}, [] as ComponentCategory[])).sort();

export const groupedComponents = categories.map(category => ({
  name: category,
  components: components.filter(c => c.category === category),
}));
