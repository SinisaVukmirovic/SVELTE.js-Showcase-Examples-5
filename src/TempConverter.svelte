<script>
    let c = 0;
    let f = 32;

    function setBothFromC(value) {
        c = +value;
        f = +(32 + (9 / 5 * c)).toFixed(1);
    }

    function setBothFromF(value) {
        f = +value;
        c = (5 / 9 * (f - 32)).toFixed(1);
    }
</script>

<style>
	input {
		width: 7em;
	}
</style>

<input type="number" value={c} on:input={e => setBothFromC(e.target.value)}>
°C =
<input type="number" value={f} on:input={e => setBothFromF(e.target.value)}>
°F

