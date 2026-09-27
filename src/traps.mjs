// Game-time seconds only: pause/blur also freezes the hazard cycle.
export function spikeState(time){const phase=((time%6)+6)%6;const active=phase>=3;return {phase,active,warning:phase>=2.2&&!active,height:active?Math.round(30*Math.min(1,(phase-3)/.2,(6-phase)/.2)):0,remaining:Math.ceil(active?6-phase:3-phase)}}
export function touchesSpikes(player,trap,time){const s=spikeState(time);return s.height>0&&player.x+11>trap.x&&player.x-11<trap.x+trap.w&&player.y+11>trap.y-s.height&&player.y-11<trap.y}
