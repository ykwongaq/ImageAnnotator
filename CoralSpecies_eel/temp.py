from typing import List
import numpy as np

def filter_masks_by_iou_and_area(
    iou_matrix: np.ndarray, threshold: float, areas: List[float]
) -> set:
    n = iou_matrix.shape[0]
    filtered_indices = set()

    # Create a list of all indices sorted by area in descending order
    sorted_indices = sorted(range(n), key=lambda idx: areas[idx], reverse=True)

    keep_mask = np.zeros(n, dtype=bool)

    for idx in sorted_indices:
        if not keep_mask[idx]:
            filtered_indices.add(idx)
            # Mark all masks with IoU > threshold as kept
            keep_mask[iou_matrix[idx] > threshold] = True

    return filtered_indices

# Test cases
def test_filter_masks_by_iou_and_area():
    # Test case 1: Simple case with no overlaps
    iou_matrix1 = np.array([
        [1.0, 0.2, 0.1],
        [0.2, 1.0, 0.3],
        [0.1, 0.3, 1.0]
    ])
    areas1 = [10, 20, 30]
    threshold1 = 0.5
    result1 = filter_masks_by_iou_and_area(iou_matrix1, threshold1, areas1)
    assert result1 == {0, 1, 2}, f"Test case 1 failed: {result1}"

    # Test case 2: One overlap, choose larger area
    iou_matrix2 = np.array([
        [1.0, 0.6],
        [0.6, 1.0]
    ])
    areas2 = [10, 20]
    threshold2 = 0.5
    result2 = filter_masks_by_iou_and_area(iou_matrix2, threshold2, areas2)
    assert result2 == {1}, f"Test case 2 failed: {result2}"

    # Test case 3: Multiple overlaps with different areas
    iou_matrix3 = np.array([
        [1.0, 0.6, 0.2],
        [0.6, 1.0, 0.7],
        [0.2, 0.7, 1.0]
    ])
    areas3 = [15, 25, 35]
    threshold3 = 0.5
    result3 = filter_masks_by_iou_and_area(iou_matrix3, threshold3, areas3)
    assert result3 == {2, 0}, f"Test case 3 failed: {result3}"

    # Test case 4: No overlaps
    iou_matrix4 = np.array([
        [1.0, 0.2, 0.1],
        [0.2, 1.0, 0.1],
        [0.1, 0.1, 1.0]
    ])
    areas4 = [5, 15, 25]
    threshold4 = 0.5
    result4 = filter_masks_by_iou_and_area(iou_matrix4, threshold4, areas4)
    assert result4 == {0, 1, 2}, f"Test case 4 failed: {result4}"

    # Test case 5: All masks overlap, choose the one with the largest area
    iou_matrix5 = np.array([
        [1.0, 0.9, 0.8],
        [0.9, 1.0, 0.7],
        [0.8, 0.7, 1.0]
    ])
    areas5 = [50, 60, 70]
    threshold5 = 0.5
    result5 = filter_masks_by_iou_and_area(iou_matrix5, threshold5, areas5)
    assert result5 == {2}, f"Test case 5 failed: {result5}"

    print("All test cases passed!")

test_filter_masks_by_iou_and_area()