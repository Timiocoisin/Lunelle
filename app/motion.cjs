'use strict';
// Drag math uses only host screen-DIP coordinates, never DOM screenX/Y.
// Bounds come from the pointer-down snapshot, not the last moved window.
function facingFor(bounds, area, previous = 'right') {
  const delta = bounds.x + bounds.width / 2 - (area.x + area.width / 2);
  if (delta < -32) return 'right';
  if (delta > 32) return 'left';
  return previous;
}
function dragBounds(start, pointer, area) {
  const x = start.bounds.x + pointer.x - start.pointer.x;
  const y = start.bounds.y + pointer.y - start.pointer.y;
  const scale = Math.min(start.bounds.width / 1530, start.bounds.height / 990);
  const petLeft = 645 * scale, petWidth = 240 * scale;
  return { x: Math.round(Math.max(area.x - petLeft, Math.min(area.x + area.width - petLeft - petWidth, x))),
    y: Math.round(Math.max(area.y, Math.min(area.y + area.height - start.bounds.height, y))),
    width: start.bounds.width, height: start.bounds.height };
}
class PetMotion {
  constructor({window, cursor, display, notify = () => {}, save = () => {}}) {
    Object.assign(this, {window, cursor, display, notify, save});
    this.start = null; this.facing = 'right'; this.petOffset = 0;
  }
  get active() { return this.start !== null; }
  updateFacing(extra={}) {
    const bounds = this.window.getBounds(),s=Math.min(bounds.width/1530,bounds.height/990);
    const pet={x:bounds.x+645*s,width:240*s};
    const area=this.display({x:pet.x+pet.width/2,y:bounds.y+bounds.height-40}).workArea;
    this.facing = facingFor(pet, area, this.facing);
    const panelX=bounds.x+515*s,panelWidth=500*s;
    const safeX=Math.max(area.x+4,Math.min(area.x+area.width-panelWidth-4,panelX));
    this.notify({dragging:this.active,facing:this.facing,panelShift:(safeX-panelX)/s,...extra});
  }
  settle() {
    // Compatibility entry point: geometry notifications only. Never move the
    // native window and compensate the sprite asynchronously.
    this.updateFacing();
  }
  begin() {
    if (this.active) return;
    this.start = {bounds: {...this.window.getBounds()}, pointer: {...this.cursor()}, petOffset:this.petOffset};
    this.moved=false;
    this.window.setIgnoreMouseEvents(false);
    this.updateFacing();
  }
  move() {
    if (!this.active) return;
    const pointer = this.cursor(), area = this.display(pointer).workArea;
    this.moved ||= Math.hypot(pointer.x-this.start.pointer.x,pointer.y-this.start.pointer.y)>4;
    const next = dragBounds(this.start, pointer, area);
    // A drag updates position only; repeated size writes can feed DPI rounding
    // back into renderer layout on Windows.
    this.window.setPosition(next.x, next.y, false);
    this.updateFacing();
  }
  end(activate=false) {
    if (!this.active) return;
    const p=this.cursor();this.moved ||= Math.hypot(p.x-this.start.pointer.x,p.y-this.start.pointer.y)>4;
    const togglePanel=activate&&!this.moved;
    this.start = null; this.updateFacing({togglePanel});
    const b=this.window.getBounds(),s=Math.min(b.width/1530,b.height/990);
    this.save({x:b.x+645*s,y:b.y,petOffset:0,positionVersion:2});
  }
}
module.exports = {facingFor, dragBounds, PetMotion};
