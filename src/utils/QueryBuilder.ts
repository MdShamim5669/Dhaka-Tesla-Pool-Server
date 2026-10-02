/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IQueryParams,
  IPaginationOptions,
  IPaginationMeta,
  IQueryResult,
  IExecuteOptions,
} from './utils.interface.js';

export class QueryBuilder<T = any> {
  public model: any;
  public query: IQueryParams;
  public where: Record<string, any>;
  public orderBy: Record<string, any>;
  public pagination: IPaginationOptions;

  constructor(model: any, query: IQueryParams) {
    this.model = model;
    this.query = query || {};
    this.where = {};
    this.orderBy = {};
    this.pagination = {
      page: 1,
      limit: 10,
      skip: 0,
    };
  }

  /**
   * Search across specified string fields using case-insensitive contains
   */
  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm || this.query.search;
    if (searchTerm && searchableFields.length > 0) {
      this.where.OR = searchableFields.map((field) => ({
        [field]: {
          contains: String(searchTerm),
          mode: 'insensitive',
        },
      }));
    }
    return this;
  }

  /**
   * Filter query parameters excluding pagination and sorting control fields
   */
  filter(
    excludeFields: string[] = ['searchTerm', 'search', 'page', 'limit', 'sortBy', 'sortOrder', 'fields']
  ): this {
    const queryObj: Record<string, any> = { ...this.query };

    // Remove reserved query parameters
    excludeFields.forEach((field) => delete queryObj[field]);

    // Apply exact filter conditions
    Object.keys(queryObj).forEach((key) => {
      const val = queryObj[key];
      if (val !== undefined && val !== null && val !== '') {
        if (val === 'true') {
          this.where[key] = true;
        } else if (val === 'false') {
          this.where[key] = false;
        } else if (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '' && !val.includes('-')) {
          this.where[key] = Number(val);
        } else {
          this.where[key] = val;
        }
      }
    });

    return this;
  }

  /**
   * Set sorting order
   */
  sort(defaultSortBy = 'createdAt', defaultSortOrder: 'asc' | 'desc' = 'desc'): this {
    const sortBy = this.query.sortBy || defaultSortBy;
    const sortOrder =
      this.query.sortOrder?.toLowerCase() === 'asc' ? 'asc' : defaultSortOrder;

    this.orderBy = {
      [sortBy]: sortOrder,
    };

    return this;
  }

  /**
   * Configure pagination: page, limit, and skip
   */
  paginate(): this {
    const page = Math.max(1, Number(this.query.page) || 1);
    const limit = Math.max(1, Number(this.query.limit) || 10);
    const skip = (page - 1) * limit;

    this.pagination = {
      page,
      limit,
      skip,
    };

    return this;
  }

  /**
   * Calculate pagination metadata
   */
  async countTotal(): Promise<IPaginationMeta> {
    const total = await this.model.count({ where: this.where });
    const { page, limit } = this.pagination;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Execute findMany query and return records with pagination metadata
   */
  async execute(options?: IExecuteOptions): Promise<IQueryResult<T>> {
    const { skip, limit, page } = this.pagination;

    const findArgs: any = {
      where: this.where,
      orderBy: this.orderBy,
      skip,
      take: limit,
      ...options,
    };

    const [data, total] = await Promise.all([
      this.model.findMany(findArgs),
      this.model.count({ where: this.where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

export default QueryBuilder;
