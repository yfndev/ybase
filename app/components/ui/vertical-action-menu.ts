export const verticalActionMenuClassNames = {
  trigger:
    "rounded-[0.25rem] border-0 bg-transparent text-foreground shadow-none transition-colors duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:shadow-none [&_svg]:size-6",
  content:
    "min-w-[220px] animate-menu-enter rounded-[0.125rem] border-0 bg-background p-0 text-foreground shadow-member-menu will-change-[transform,opacity] motion-reduce:animate-none data-[side=bottom]:[--menu-enter-y:2px] data-[side=left]:[--menu-enter-x:2px] data-[side=right]:[--menu-enter-x:-2px] data-[side=top]:[--menu-enter-y:-2px] [&>*:not(:last-child)]:border-b",
  item: "relative flex cursor-pointer flex-wrap items-center gap-4 rounded-none px-4 py-3 font-medium text-foreground outline-none select-none data-[highlighted]:bg-primary data-[highlighted]:text-black [&_svg]:size-6",
  destructiveItem: "text-destructive",
} as const;
