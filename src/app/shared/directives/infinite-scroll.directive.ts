import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, input, output } from '@angular/core';

/**
 * Fires `threshold` when the host element enters the viewport, so callers
 * can load the next page. Placed on a sentinel <div> at the end of a list.
 * Uses IntersectionObserver instead of scroll events because it runs off
 * the main thread and doesn't fire on every pixel of scroll.
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true,
})
export class InfiniteScrollDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  /** Start loading this far before the sentinel is actually visible. */
  readonly rootMargin = input('400px');
  readonly disabled = input(false);
  readonly threshold = output<void>();

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !this.disabled()) {
          this.threshold.emit();
        }
      },
      { rootMargin: this.rootMargin() }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}