<script>
    let frames = [
        {
            frame: 'Svelte',
            description: 'Amazing'
        },
        {
            frame: 'Vue',
            description: 'Good'
        },
        {
            frame: 'React',
            description: 'Not reactive'
        },
        {
            frame: 'Angular',
            description: 'Difficult'
        }
    ];

    let prefix = '';
	let frame = '';
	let description = '';
    let i = 0;
    
    $: filteredFrames = prefix
		? frames.filter(frame => {
			const name = `${frame.description} - ${frame.frame}`;
			return name.toLowerCase().startsWith(prefix.toLowerCase());
		})
		: frames;

	$: selected = filteredFrames[i];

    $: reset_inputs(selected);


    function create() {
		frames = frames.concat({ frame, description });
		i = frames.length - 1;
		frame = description = '';
	}

	function update() {
		frames[i] = { frame, description };
	}

	function remove() {
		// Remove selected frame from the source array (frames), not the filtered array
		const index = frames.indexOf(selected);
		frames = [...frames.slice(0, index), ...frames.slice(index + 1)];

		frame = description = '';
		i = Math.min(i, filteredFrames.length - 2);
	}

	function reset_inputs(person) {
		frame = person ? person.frame : '';
		description = person ? person.description : '';
	}
</script>

<style>
	input {
		display: block;
		margin: 0 0 .5em 0;
		width: 19em;
	}

	select {
		margin: 1em 0;
		width: 19em;
	}

	.buttons {
		display: flex;
        justify-content: flex-start;
        margin: 1em 0;
	}
</style>

<input placeholder="Filter by adjective" bind:value={prefix}>

<select bind:value={i} size={4}>
	{#each filteredFrames as frame, i}
		<option value={i}>{frame.description}, {frame.frame}</option>
	{/each}
</select>

<label><input bind:value={frame} placeholder="Framework"></label>
<label><input bind:value={description} placeholder="Description"></label>

<div class='buttons'>
	<button on:click={create} disabled="{!frame || !description}">Create</button>
	<button on:click={update} disabled="{!frame || !description || !selected}">Update</button>
	<button on:click={remove} disabled="{!selected}">Delete</button>
</div>