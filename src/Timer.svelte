<script>
    import { onDestroy } from 'svelte';

    let elapsed = 0;
	let duration = 5000;

    let last_time = window.performance.now();
    let frame;
    
    (function update() {
		frame = requestAnimationFrame(update);

		const time = window.performance.now();
		elapsed += Math.min(
			time - last_time,
			duration - elapsed
		);

		last_time = time;
	}());

	onDestroy(() => {
		cancelAnimationFrame(frame);
	});
</script>

<style>
    p {
        text-align: center;
        color: cornflowerblue;
    }
</style>

<label>
	Elapsed time:
	<progress value="{elapsed / duration}"></progress>
</label>

<p>{(elapsed / 1000).toFixed(1)} seconds</p>

<label>
	Duration:
	<input type="range" bind:value={duration} min="1" max="20000">
</label>
<br>
<button on:click="{() => elapsed = 0}">Reset Timer</button>