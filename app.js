// 等待所有库加载完成
window.addEventListener('load', function() {
    const { createApp } = Vue;

    createApp({
        data() {
            return {
                urlInput: '',
                urls: [],
                qrCodes: []
            }
        },
        methods: {
            // 生成二维码
            async generateQRCodes() {
                // 解析输入的URL
                const lines = this.urlInput.split('\n');
                this.urls = lines
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                if (this.urls.length === 0) {
                    alert('请输入至少一个网址！');
                    return;
                }

                // 清空之前的二维码
                this.qrCodes = [];

                // 等待DOM更新
                await this.$nextTick();

                // 为每个URL生成二维码
                for (let i = 0; i < this.urls.length; i++) {
                    this.qrCodes.push({
                        url: this.urls[i],
                        index: i + 1
                    });

                    // 等待DOM更新后再生成二维码
                    await this.$nextTick();

                    const canvas = document.getElementById('qr-' + i);
                    if (canvas) {
                        try {
                            // 使用qrcode-generator库生成二维码
                            const qr = qrcode(0, 'H');
                            qr.addData(this.urls[i]);
                            qr.make();
                            
                            // 设置canvas尺寸
                            const cellSize = 4;
                            const margin = 8;
                            const size = qr.getModuleCount() * cellSize + margin * 2;
                            canvas.width = size;
                            canvas.height = size;
                            
                            const ctx = canvas.getContext('2d');
                            
                            // 绘制白色背景
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, size, size);
                            
                            // 绘制二维码
                            ctx.fillStyle = '#000000';
                            for (let row = 0; row < qr.getModuleCount(); row++) {
                                for (let col = 0; col < qr.getModuleCount(); col++) {
                                    if (qr.isDark(row, col)) {
                                        ctx.fillRect(
                                            col * cellSize + margin,
                                            row * cellSize + margin,
                                            cellSize,
                                            cellSize
                                        );
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('生成二维码失败:', error);
                        }
                    }
                }

                // 滚动到二维码区域
                setTimeout(() => {
                    document.querySelector('.qr-section')?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            },

            // 下载单个二维码
            downloadSingle(index) {
                const canvas = document.getElementById('qr-' + index);
                if (canvas) {
                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `qrcode-${String(index + 1).padStart(3, '0')}.png`;
                        a.click();
                        URL.revokeObjectURL(url);
                    });
                }
            },

            // 下载全部二维码
            async downloadAll() {
                if (this.qrCodes.length === 0) {
                    return;
                }

                const zip = new JSZip();
                const folder = zip.folder('qrcodes');

                // 将所有二维码添加到zip
                for (let i = 0; i < this.qrCodes.length; i++) {
                    const canvas = document.getElementById('qr-' + i);
                    if (canvas) {
                        const blob = await new Promise(resolve => canvas.toBlob(resolve));
                        const filename = `${String(i + 1).padStart(3, '0')}.png`;
                        folder.file(filename, blob);
                    }
                }

                // 生成并下载zip文件
                zip.generateAsync({ type: 'blob' }).then((content) => {
                    saveAs(content, `qrcodes-${this.qrCodes.length}-${Date.now()}.zip`);
                });
            },

            // 清空所有内容
            clearAll() {
                if (this.qrCodes.length > 0) {
                    if (!confirm('确定要清空所有内容吗？')) {
                        return;
                    }
                }
                this.urlInput = '';
                this.urls = [];
                this.qrCodes = [];
            },

            // 截断URL显示
            truncateUrl(url) {
                if (url.length > 30) {
                    return url.substring(0, 27) + '...';
                }
                return url;
            }
        }
    }).mount('#app');
});
