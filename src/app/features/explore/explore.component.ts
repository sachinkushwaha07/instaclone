import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO: masonry/grid layout backed by a cursor-paginated ExploreStore,
// same pattern as FeedStore. Wire up search with debounced typeahead
// against UsersApi.search() once the backend endpoint exists.
@Component({
  selector: 'app-explore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent {}
