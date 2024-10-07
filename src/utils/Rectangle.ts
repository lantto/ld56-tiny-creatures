export class Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  contains(point: { x: number, y: number }): boolean {
    return (point.x >= this.x &&
      point.x < this.x + this.w &&
      point.y >= this.y &&
      point.y < this.y + this.h);
  }
  intersects(range: Rectangle): boolean {
    return !(this.x + this.w < range.x ||
      this.x > range.x + range.w ||
      this.y + this.h < range.y ||
      this.y > range.y + range.h);
  }
}