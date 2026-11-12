import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Cached OpenStreetMap hospital lists, so repeat searches (same city, same
 * neighbourhood) are instant and the free volunteer servers get fewer requests.
 * Public map data only; nothing about users is stored here.
 */
@Entity('place_cache')
export class PlaceCache {
  /** sha256 of the search (e.g. "place:relation:1950198") */
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key: string;

  @Column({ type: 'varchar', length: 120 })
  label: string;

  /** Trimmed OpenStreetMap elements: type, id, position and the tags the site uses */
  @Column({ type: 'jsonb' })
  elements: unknown[];

  @Index()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
