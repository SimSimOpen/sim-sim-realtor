import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryIcon } from '../../components/category-icon';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { CategoryService } from '../../shared/services/category.service';
import { MarketplaceCategory, SECTION_ROUTES } from '../../shared/constants/categories';

@Component({
  selector: 'app-products',
  imports: [CommonModule, CategoryIcon, TranslatePipe],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private router = inject(Router);
  public categoryService = inject(CategoryService);

  categories = this.categoryService.categories;

  /** Picked category that has no admin screen yet; drives the "not active" panel. */
  inactive: MarketplaceCategory | null = null;

  choose(category: MarketplaceCategory) {
    const route = SECTION_ROUTES[category.slug];
    if (category.available && route) {
      this.router.navigate([route]);
      return;
    }
    this.inactive = category;
  }
}
