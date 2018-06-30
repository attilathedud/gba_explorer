<script>
export default {
    methods: {
        getHex: function(string) {
            return parseInt(string, 16);
        },
        toHexString: function(number, padding) {
            return Number(number).toString(16).toUpperCase().padStart(padding, '0')
        }
    }
};
</script>