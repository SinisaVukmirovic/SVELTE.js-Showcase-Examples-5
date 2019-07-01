<script>
	import Header from './Header.svelte';
	import Counter from './Counter.svelte';
	import TempConverter from './TempConverter.svelte';
	import Timer from './Timer.svelte';
	import CrudApp from './CrudApp.svelte';
	import Footer from './Footer.svelte';
</script>

<style>
	.container {
		font-size: 1.25rem;
		width: 60%;
		margin: 1em auto;
		padding: 1em;
	}

	@media screen and (max-width: 900px) {
		.container {
			width: 80%;
		}
	}

	@media screen and (max-width: 768px) {
		.container {
			width: 90%;
		}
	}
</style>

<!-- ======================================== -->

<Header/>

<div class="container">
	<h3>Counter</h3>

	<Counter/>

	<hr>

	<h3>Temperature Converter</h3>

	<TempConverter/>

	<hr>

	<h3>Timer</h3>

	<Timer/>

	<hr>

	<h3>CRUD App</h3>

	<CrudApp/>

</div>

<Footer/>