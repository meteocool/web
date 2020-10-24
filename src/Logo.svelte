<script>
    import {onMount} from 'svelte';
    import logo from "../assets/logo.svg";
    import InlineSVG from 'svelte-inline-svg'
    import '@shoelace-style/shoelace/dist/shoelace/shoelace.css';
    import {
        defineCustomElements,
        setAssetPath
    } from '@shoelace-style/shoelace';

    setAssetPath(document.currentScript.src);
    defineCustomElements();

    onMount(() => {
        const dialog = document.querySelector('.dialog-overview');
        const openButton = document.getElementById('about')
        const closeButton = dialog.querySelector('sl-button[slot="footer"]');

        openButton.addEventListener('click', () => dialog.show());
        closeButton.addEventListener('click', () => dialog.hide());
    });
</script>

<style>

</style>

<nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
        <a class="navbar-item" href="/">
            <InlineSVG src={logo} alt="meteocool" class="navbar-item" style="height: 42px;" />
        </a>
    </div>
    <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
            <a class="navbar-item" id="about">About & Apps</a>
        </div>
    </div>
</nav>

<sl-dialog label="meteocool" class="dialog-overview">
    <a href="https://itunes.apple.com/app/meteocool-rain-radar/id1438364623">iOS</a> & <a href="https://play.google.com/store/apps/details?id=com.meteocool">Android</a><br>
    Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nemo doloribus tenetur dolorem vero rem minus numquam. Voluptate, tenetur dolore, quidem quae voluptas voluptatibus itaque minus eligendi adipisci quibusdam dignissimos quo!
    <sl-button slot="footer" type="primary">Close</sl-button>
</sl-dialog>
