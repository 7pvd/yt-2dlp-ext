# Z 2 D L P
>In short: "x to yt-dlp" browser extension


## Overview
Bringing the power and convenience of yt-dlp from the command line to your browser, allowing you to browse the web and download simultaneously without leaving the browser window. Currently, supports Firefox and Chrome* trên Windows.


## Requirements

- Preinstalled `python` (>=3.9)
- `python` and `pip` binary must be in `PATH`
- a working keyboard (I use ctrl+alt+y for `forward-url` and ctrl+alt+u for `forward-url-with-param`)
- Firefox or Chrome. 
  - For other Chromium-based browsers. The registry key path might different. Open new issue and just tell me what browser named

## Installation

- This project is divided into two parts: the file system and the browser.
- The native host wraps around yt-dlp and executes commands just like in the command line.
- The browser extension provides configuration presets, syncs configurations, sends URLs to the Native Host, and displays status.


### Installing the Extension

- **Firefox**: You can install from the XPI file in the Releases section of this repository or directly from AMO: <url>
- **Chrome**: Due to Google's policy, web store developers must pay a $5 fee to contribute to their ecosystem. I disagree with this policy. Therefore, you can only load the extension unpacked from the source code. For detailed instructions on loading unpacked, please search for it on a search engine.


### Installing the Host

- Run `install-host.bat` and follow the instructions in the console. Don't worry, everything is automated, you just need to answer YES or NO.


### Uninstallation

- **Browser**: Uninstall via the Addon/Extension Manager as usual.
- **Native Host**: Run `uninstall-host.bat`.


### Troubleshooting

The application provides comprehensive logs of its operations. You can view the logs at:

*Installation and Uninstallation Logs*

Search for `z2dlp` in the %TEMP% directory. It is usually located at `C:\Users\YOUR_USER_NAME\AppData\Local\Temp`.

*NH Runtime Logs*

The installation directory when you run `install-host`. It may be one of the following:
```
C:\Users\YOUR_USER_NAME\AppData\Local\Z2DLPHost\logs
or
C:\Program Files\Z2DLPHost\logs
or
the directory where you cloned this repository
```



### Author and License

**Author**: Zuko

**License**: CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)

**TLDR License**: You can share/modify as long as you don't sell it.

# Z 2 D L P - BẰNG TIẾNG VIỆT
> Ngắn gọn: Tải video youtube bằng `yt-dlp` trên trình duyệt
> `yt-dlp` còn hỗ trợ hơn 1000 website khác
## Tổng quan
Mang sức mạnh và sự tiện lợi của yt-dlp từ command line tới trình duyệt của bạn, giúp bạn vừa duyệt web và tải xuống đồng thời mà không cần phải rời cửa sổ trình duyệt. Hiện hỗ trợ firefox và chrome*

## Cài đặt
- Dự án này chia làm 2 phần ở 2 phía: File-system và trình duyệt
- Native host bọc ngoài yt-dlp và thực thi các lệnh như với command line bình thường
- Extension bên phía trình duyệt cung cấp khả năng cấu hình presets, đồng bộ hoá cấu hình. Gửi URL tới Native Host và hiển thị trạng thái.

### Cài đặt extension
- **Firefox**
 bạn có thể cài từ xpi ở Release của repository này. Hoặc trực tiếp từ AMO: <url>
- **Chrome** do chính sách của Google. Web Store developer phải trả khoản phí 5$ để đóng góp cho hệ sinh thái của họ, tôi không đồng tình với chính sách này. Vì vậy bạn chỉ có thể load unpacked từ source code. Chi tiết hướng dẫn load unpacked vui lòng tìm kiếm trên Search Engine.

### Cài đặt host
- Chạy `install-host.bat` và làm theo các hướng dẫn trên console. Nhưng đừng lo lắng, mọi thứ được tự động hoá, bạn chỉ phải YES hoặc NO thôi.

### Gỡ cài đặt
- Với trình duyệt: gỡ thông qua Addon/Extension Manager như bình thường.
- NH: chạy uninstall-host.bat

### Troubleshot
- Ứng dụng có log rất đầy đủ về quá trình hoạt động. Bạn có thể xem log tại:

*log cài đặt và gỡ*: tìm kiếm z2dlp trong thư mục %TEMP%. Thường là C:\Users\YOUR_USER_NAME\AppData\Local\Temp.
*log hoạt động*: Thư mục cài đặt khi bạn chạy install-host. Có thể là 1 trong 3:
C:\Users\YOUR_USER_NAME\AppData\Local\Z2DLPHost\logs
hoặc
C:\Program Files\Z2DLPHost\logs
hoặc
thư mục mà bạn clone repository này

### Tác Giả và Giấy Phép

**Author**: Zuko

**License**: CC BY-NC 4.0 (https://creativecommons.org/licenses/by-nc/4.0/)

**TLDR License**: You can share/modify as long as you don't sell it.
