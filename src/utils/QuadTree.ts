import { Rectangle } from './Rectangle';
import { Entity } from '../types';
export class QuadTree {
  boundary: Rectangle;
  capacity: number;
  entities: Entity[];
  divided: boolean;
  northwest: QuadTree | null;
  northeast: QuadTree | null;
  southwest: QuadTree | null;
  southeast: QuadTree | null;
  constructor(boundary: Rectangle, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.entities = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
  insert(entity: Entity): boolean {
    if (!this.boundary.contains(entity)) {
      return false;
    }
    if (this.entities.length < this.capacity && !this.divided) {
      this.entities.push(entity);
      return true;
    }
    if (!this.divided) {
      this.subdivide();
    }
    return (this.northwest!.insert(entity) ||
      this.northeast!.insert(entity) ||
      this.southwest!.insert(entity) ||
      this.southeast!.insert(entity));
  }
  subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;
    this.northwest = new QuadTree(new Rectangle(x, y, w, h), this.capacity);
    this.northeast = new QuadTree(new Rectangle(x + w, y, w, h), this.capacity);
    this.southwest = new QuadTree(new Rectangle(x, y + h, w, h), this.capacity);
    this.southeast = new QuadTree(new Rectangle(x + w, y + h, w, h), this.capacity);
    this.divided = true;
    for (let entity of this.entities) {
      this.insert(entity);
    }
    this.entities = [];
  }
  query(range: Rectangle, found: Entity[] = []): Entity[] {
    if (!this.boundary.intersects(range)) {
      return found;
    }
    for (let entity of this.entities) {
      if (range.contains(entity)) {
        found.push(entity);
      }
    }
    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }
    return found;
  }
}